import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import {
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { cfEntityCatalog } from '../../../../cloud-foundry/src/cf-entity-catalog';
import {
  organizationEntityType,
  serviceInstancesEntityType,
  spaceEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/src/cf-types';
import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { fetchTotalResults } from '../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { QParam, QParamJoiners } from '../../../../cloud-foundry/src/shared/q-param';
import { ClearPaginationOfType } from '../../../../store/src/actions/pagination.actions';
import { EntityCatalogEntityConfig } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';

@Injectable()
export class CloudFoundryUserProvidedServicesService {

  private serviceInstancesEntityConfig: EntityCatalogEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: serviceInstancesEntityType
  };

  // TODO: RC 1 test, demo
  private userProvidedServiceInstancesEntityConfig: EntityCatalogEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: userProvidedServiceInstanceEntityType
  };

  constructor(
    private store: Store<CFAppState>,
    // private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {

    const endpointGuid = 'uEQrNbUurmOUnGqj6cHGyMP60XA';
    const upsiGuid = 'be04b992-1127-4351-b123-0b09b30228d3';
    const spaceGuid = '23f8c13e-631c-43d1-b412-349198632960';
    const pagKey = 'paginationKey123456';

    // cfEntityCatalog.userProvidedServiceEntity.api2.createAction.getAllInSpace();
    // cfEntityCatalog.appEnvVar.actions.addNewToApplication();
    // cfEntityCatalog.appEnvVar.api.addNewToApplication()
    // cfEntityCatalog.appEnvVar.storage2.getEntityService()
    // cfEntityCatalog.appEnvVar.storage2.instances.addNewToApplication.getPaginationMonitor()
    // cfEntityCatalog.appEnvVar.storage2.instances.addNewToApplication.getPaginationService()
    // cfEntityCatalog.appEnvVar.storage2.instances.



    // cfEntityCatalog.userProvidedServiceEntity.actions.getAllInSpace //action
    // cfEntityCatalog.userProvidedServiceEntity.api.getAllInSpace(). // execute
    // cfEntityCatalog.userProvidedServiceEntity.instance.getEntityMon
    // cfEntityCatalog.userProvidedServiceEntity.instance.getAllInSpace.getPaginationMonitor

    // // TODO: RC TIDY Remove all this
    // cfEntityCatalog.userProvidedServiceEntity.storage2.instances.




    // cfEntityCatalog.userProvidedService.actions.get(...);
    // cfEntityCatalog.userProvidedService.actions.getAllInSpace(...);

    // cfEntityCatalog.userProvidedService.api.get<ActionState>().pipe(tap(a => console.log('Kind of State: ', a)));
    // cfEntityCatalog.userProvidedService.api.getAllInSpace<ListActionState>();


    const entMonitor = cfEntityCatalog.userProvidedService.store.getEntityMonitor(
      upsiGuid
    ).entity$.subscribe(a => console.log('entMonitor: ', a));

    const entService = cfEntityCatalog.userProvidedService.store.getEntityService(
      upsiGuid, // Per action builder
      endpointGuid, {
      includeRelations: [

      ]
    } // Per action builder

    ).entityObs$.subscribe(a => console.log('entService: ', a));

    const pagMon = cfEntityCatalog.userProvidedService.store.getPaginationMonitor(
      pagKey, // Per action builder
      endpointGuid, // Per action builder
    ).currentPage$.subscribe(a => console.log('pagMon: ', a));

    const pagObservables = cfEntityCatalog.userProvidedService.store.getPaginationService(
      pagKey, // Per action builder
      endpointGuid, // Per action builder
    ).entities$.subscribe(a => console.log('pagObservables: ', a));


    // cfEntityCatalog.appEnvVar.actions.

    // cfEntityCatalog.userProvidedService.store.getAllInSpace.getPaginationService()
    // cfEntityCatalog.application.store.getAllInSpace.getPaginationMonitor()
    // cfEntityCatalog.application.actions.

    // cfEntityCatalog.appEnvVar.store.





    // cfEntityCatalog.userProvidedServiceEntity.storage2.instances.
    const allInSpacePagMonitor = cfEntityCatalog.userProvidedService.store.getAllInSpace.getPaginationMonitor(
      endpointGuid, // Per action builder
      spaceGuid, // Per action builder
      null, // Per action builder
      getUserProvidedServiceInstanceRelations, // Per action builder
      true// Per action builder
    ).currentPage$.subscribe(a => console.log('allInSpacePagMonitor: ', a));

    const allInSpacePagObservables = cfEntityCatalog.userProvidedService.store.getAllInSpace.getPaginationService(
      endpointGuid, // Per action builder
      spaceGuid, // Per action builder
      null, // Per action builder
      getUserProvidedServiceInstanceRelations, // Per action builder
      true// Per action builderS
    ).entities$.subscribe(a => console.log('allInSpacePagObservables: ', a));

    // cfEntityCatalog.userProvidedServiceEntity.storage2.instances.

    const updateAction = cfEntityCatalog.userProvidedService.actions.update(
      upsiGuid, // Per action builder
      endpointGuid, // Per action builder
      {} as Partial<IUserProvidedServiceInstanceData> // Per action builder
    );
    // this.store.dispatch(updateAction);
  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {

    const pagObs = cfEntityCatalog.userProvidedService.store.getAllInSpace.getPaginationService(
      cfGuid, spaceGuid, null, relations, true
    );
    return combineLatest([
      pagObs.entities$, // Ensure entities is subbed to the fetch kicks off
      pagObs.fetchingEntities$
    ]).pipe(
      filter(([, fetching]) => !fetching),
      map(([entities]) => entities)
    );

    // const actionBuilder = cfEntityCatalog.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    // const action = actionBuilder(cfGuid, spaceGuid, null, relations, true);
    // // const action = new GetAllU
    // const pagObs = getPaginationObservables({
    //   store: this.store,
    //   action,
    //   paginationMonitor: this.paginationMonitorFactory.create(
    //     action.paginationKey,
    //     action,
    //     action.flattenPagination
    //   )
    // }, action.flattenPagination);
  }

  public fetchUserProvidedServiceInstancesCount(cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;

    const action = cfEntityCatalog.userProvidedService.actions.getMultiple(
      createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
      cfGuid,
      { includeRelations: [], populateMissing: false }
    );
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, QParamJoiners.in).toString());
    }
    return fetchTotalResults(action, this.store, this.paginationMonitorFactory);


    // const actionBuilder = cfEntityCatalog.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    // const action = actionBuilder(
    //   createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
    //   cfGuid,
    //   { includeRelations: [], populateMissing: false }
    // ) as PaginatedAction;
  }

  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedServiceInstance>> {
    return cfEntityCatalog.userProvidedService.store.getEntityService(upsGuid, cfGuid, {}).waitForEntity$.pipe(
      map(e => e.entity)
    );
    // const actionBuilder = cfEntityCatalog.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('get');
    // const getUserProvidedServiceAction = actionBuilder(upsGuid, cfGuid);
    // const service = this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
    //   upsGuid,
    //   getUserProvidedServiceAction
    // );
    // return service.waitForEntity$.pipe(
    //   map(e => e.entity)
    // );
  }

  public createUserProvidedService(
    cfGuid: string,
    guid: string,
    data: IUserProvidedServiceInstanceData
  ): Observable<RequestInfoState> {
    return cfEntityCatalog.userProvidedService.api.create<RequestInfoState>(
      cfGuid,
      guid,
      data,
      this.userProvidedServiceInstancesEntityConfig
    ).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.creating && !newV.creating),
      map(([, newV]) => newV),
      first(),
      tap(v => {
        if (!v.error) {
          // Problem - Lists with multiple actions aren't updated following the creation of an entity based on secondary action
          // Here the service instance list (1st action SI, 2nd action UPSI) isn't updated so manually do so
          this.store.dispatch(new ClearPaginationOfType(this.serviceInstancesEntityConfig));
        }
      })
    );

    // const action = new CreateUserProvidedServiceInstance(cfGuid, guid, data, this.userProvidedServiceInstancesEntityConfig);
    // const create$ = this.store.select(selectCfRequestInfo(userProvidedServiceInstanceEntityType, guid));
    // this.store.dispatch(action);
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<RequestInfoState> {
    return cfEntityCatalog.userProvidedService.api.update<RequestInfoState>(
      guid,
      cfGuid,
      data,
      this.userProvidedServiceInstancesEntityConfig
    ).pipe(
      filter(v => !!v.updating[UpdateUserProvidedServiceInstance.updateServiceInstance]),
      pairwise(),
      filter(([oldV, newV]) =>
        oldV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy &&
        !newV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy),
      map(([, newV]) => newV)
    );
    // TODO: RC
    // cfEntityCatalog.userProvidedServiceEntity.actionDispatchManager.dispatchUpdate(
    //   guid,
    //   cfGuid,
    //   data,
    //   this.userProvidedServiceInstancesEntityConfig
    // );
    // return cfEntityCatalog.userProvidedServiceEntity.storage2.getEntityMonitor(
    //   this.ech,
    //   guid
    // ).entityRequest$.pipe(
    //   filter(v => !!v.updating[UpdateUserProvidedServiceInstance.updateServiceInstance]),
    //   pairwise(),
    //   filter(([oldV, newV]) =>
    //     oldV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy &&
    //     !newV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy),
    //   map(([, newV]) => newV)
    // );
  }

}



