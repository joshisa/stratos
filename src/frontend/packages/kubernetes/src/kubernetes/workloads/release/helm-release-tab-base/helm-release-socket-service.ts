import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, map, share, switchMap } from 'rxjs/operators';

import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { AppState, entityCatalog, WrapperRequestActionSuccess } from '../../../../../../store/src/public-api';
import { EntityRequestAction } from '../../../../../../store/src/types/request.types';
import { kubeEntityCatalog } from '../../../kubernetes-entity-generator';
import { KubernetesPodExpandedStatusHelper } from '../../../services/kubernetes-expanded-state';
import { BasicKubeAPIResource, KubernetesPod } from '../../../store/kube.types';
import { KubePaginationAction } from '../../../store/kubernetes.actions';
import { HelmReleaseGraph, HelmReleasePod, HelmReleaseService } from '../../workload.types';
import { workloadsEntityCatalog } from '../../workloads-entity-catalog';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';


enum SocketEventTypes {
  PAUSE_TRUE = 20000,
  PAUSE_FALSE = 20001,
}

interface SocketMessage {
  type: SocketEventTypes;
}

@Injectable()
export class HelmReleaseSocketService implements OnDestroy {

  private sub: Subscription;
  private sendToSocket = new Subject<any>();
  public isPaused = false;

  constructor(
    private helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private snackbarService: SnackBarService,
  ) {

  }

  public start() {
    if (this.isStarted()) {
      return;
    }

    const releaseRef = this.helmReleaseHelper.guidAsUrlFragment();
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const streamUrl = (
      `${protocol}://${host}/pp/v1/helm/releases/${releaseRef}/status`
    );

    const socket$ = makeWebSocketObservable(streamUrl).pipe(catchError(e => {
      console.error(
        'Error while connecting to socket: ' + JSON.stringify(e)
      );
      return [];
    }),
      share(),
    );

    const messages = socket$.pipe(
      switchMap((getResponses: GetWebSocketResponses) => {
        return getResponses(this.sendToSocket);
      }),
      map((message: string) => message),
      catchError(e => {
        console.error('Workload WS error: ', e);
        return [];
      })
    );

    let prefix = '';
    this.sub = messages.subscribe(jsonString => {
      const messageObj = JSON.parse(jsonString);
      if (messageObj) {
        if (messageObj.kind === 'ReleasePrefix') {
          prefix = messageObj.data;
        } else if (messageObj.kind === 'Graph') {
          const graph: HelmReleaseGraph = messageObj.data;
          graph.endpointId = this.helmReleaseHelper.endpointGuid;
          graph.releaseTitle = this.helmReleaseHelper.releaseTitle;
          const releaseGraphAction = workloadsEntityCatalog.graph.actions.get(graph.releaseTitle, graph.endpointId);
          this.addResource(releaseGraphAction, graph);
        } else if (messageObj.kind === 'Manifest' || messageObj.kind === 'Resources') {
          // Store all of the services
          const manifest = messageObj.data;
          const resources: { [type: string]: BasicKubeAPIResource[]; } = {};

          // Store ALL resources for the release
          if (prefix) {
            manifest.forEach(resource => {
              const entityType = this.getEntityTypeForResource(resource.kind);
              if (entityType) {
                if (!resources[entityType]) {
                  resources[entityType] = [];
                }
                resources[entityType].push(resource);
              }
            });

            Object.entries(resources).forEach(([entityType, resourcesOfType]) => {
              let action: KubePaginationAction;
              if (entityType === 'pod') {
                resourcesOfType = resourcesOfType || [];
                resourcesOfType = resourcesOfType.map((pod: KubernetesPod) =>
                  KubernetesPodExpandedStatusHelper.updatePodWithExpandedStatus(pod)
                );
              }
              action = kubeEntityCatalog[entityType].actions.getInWorkload(
                this.helmReleaseHelper.endpointGuid,
                this.helmReleaseHelper.namespace,
                this.helmReleaseHelper.releaseTitle
              );
              this.populateList(action, resourcesOfType);
            });
          }

          // const resources = { ...manifest };
          // kind === 'Resources' is an array, really they should go into a pagination section
          messageObj.endpointId = this.helmReleaseHelper.endpointGuid;
          messageObj.releaseTitle = this.helmReleaseHelper.releaseTitle;

          const releaseResourceAction = workloadsEntityCatalog.resource.actions.get(
            this.helmReleaseHelper.releaseTitle,
            this.helmReleaseHelper.endpointGuid,
          );
          this.addResource(releaseResourceAction, messageObj);
        } else if (messageObj.kind === 'ManifestErrors') {
          if (messageObj.data) {
            this.snackbarService.show('Errors were found when parsing this workload. Not all resources may be shown', 'Dismiss');
          }
        }
      }
    });
  }

  /**
   * Convert type in kube api kind string to kube entity catalog property name
   */
  private getEntityTypeForResource(type: string): string {
    // TODO: Ideally this should come from some kubeEntityCatalog.allKubeEntities `def.apiName === resource.kind && def.apiWorkspaced`
    // lookup, however we don't currently have anything in the entity that matches the catalog property name
    // (apiName casing doesn't match). We should improve the whole kubeEntityCatalog[entityType] process
    switch (type) {
      case 'Service':
        return 'service';
      case 'Pod':
        return 'pod';
      case 'Job':
        return 'job';
      case 'PersistentVolumeClaim':
        return 'pvc';
      case 'ReplicaSet':
        return 'replicaSet';
      case 'Role':
        return 'role';
      case 'Secret':
        return 'secrets';
      case 'ServiceAccount':
        return 'serviceAccount';
    }
  }

  public stop() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }

  public enable(enable: boolean) {
    if (enable) {
      this.start();
    } else {
      this.stop();
    }
  }

  public isStarted(): boolean {
    return !!this.sub;
  }

  public pause(pause: boolean) {
    if (pause !== this.isPaused) {
      const message: SocketMessage = {
        type: pause ? SocketEventTypes.PAUSE_TRUE : SocketEventTypes.PAUSE_FALSE
      };
      this.sendToSocket.next(JSON.stringify(message));
      this.isPaused = pause;
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.snackbarService.hide();
  }

  private addResource(action: EntityRequestAction, data: any) {
    const catalogEntity = entityCatalog.getEntity(action);
    const response = {
      entities: {
        [catalogEntity.entityKey]: {
          [action.guid]: data
        }
      },
      result: [
        action.guid
      ]
    };
    const successWrapper = new WrapperRequestActionSuccess(response, action);
    this.store.dispatch(successWrapper);
  }

  private populateList(action: KubePaginationAction, resources: any) {
    const entity = entityCatalog.getEntity(action);
    const newResources = {};
    resources.forEach(resource => {
      const newResource: HelmReleasePod | HelmReleaseService = {
        endpointId: action.kubeGuid,
        releaseTitle: this.helmReleaseHelper.releaseTitle,
        ...resource
      };
      newResource.metadata.kubeId = action.kubeGuid;
      // The service entity from manifest is missing this, but apply here to ensure any others are caught
      newResource.metadata.namespace = this.helmReleaseHelper.namespace;
      const entityId = action.entity[0].getId(resource);
      newResources[entityId] = newResource;
    });

    const releasePods = {
      entities: { [entity.entityKey]: newResources },
      result: Object.keys(newResources)
    };
    const successWrapper = new WrapperRequestActionSuccess(releasePods, action, 'fetch', releasePods.result.length, 1);
    this.store.dispatch(successWrapper);
  }
}
