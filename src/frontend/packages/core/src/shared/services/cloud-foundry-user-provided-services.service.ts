import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import {
  CreateUserProvidedServiceInstance,
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { cfEntityCatalog } from '../../../../cloud-foundry/src/cf-entity-service';
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
import { selectCfRequestInfo } from '../../../../cloud-foundry/src/store/selectors/api.selectors';
import { ClearPaginationOfType } from '../../../../store/src/actions/pagination.actions';
import { EntityCatalogHelper } from '../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityCatalogEntityConfig } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';
import { IUserProvidedServiceInstance } from '../../core/cf-api-svc.types';


@Injectable()
export class CloudFoundryUserProvidedServicesService {

  private serviceInstancesEntityConfig: EntityCatalogEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: serviceInstancesEntityType
  };

  private userProvidedServiceInstancesEntityConfig: EntityCatalogEntityConfig = {
    endpointType: CF_ENDPOINT_TYPE,
    entityType: userProvidedServiceInstanceEntityType
  };

  private userProvidedServiceEntity = cfEntityCatalog.userProvidedServiceEntity;

  constructor(
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private ech: EntityCatalogHelper
  ) {

    // TODO: RC TIDY Remove all this
    const endpointGuid = 'uEQrNbUurmOUnGqj6cHGyMP60XA';
    const upsiGuid = 'be04b992-1127-4351-b123-0b09b30228d3';
    const spaceGuid = '23f8c13e-631c-43d1-b412-349198632960';
    const pagKey = 'paginationKey123456';

    const entMonitor = this.userProvidedServiceEntity.api.getEntityMonitor(
      this.ech,
      upsiGuid,
    ).entity$.subscribe(a => console.log('entMonitor: ', a));

    const entService = this.userProvidedServiceEntity.api.getEntityService(
      this.ech,
      upsiGuid, // Per action builder
      endpointGuid // Per action builder,
    ).entityObs$.subscribe(a => console.log('entService: ', a));

    const pagMon = this.userProvidedServiceEntity.api.getPaginationMonitor(
      this.ech,
      pagKey, // Per action builder
      endpointGuid, // Per action builder
    ).currentPage$.subscribe(a => console.log('pagMon: ', a));

    const pagObservables = this.userProvidedServiceEntity.api.getPaginationService(
      this.ech,
      pagKey, // Per action builder
      endpointGuid, // Per action builder
    ).entities$.subscribe(a => console.log('pagObservables: ', a));

    const allInSpacePagMonitor = this.userProvidedServiceEntity.api.custom.getAllInSpace(
      this.ech,
      endpointGuid, // Per action builder
      spaceGuid, // Per action builder
      null, // Per action builder
      getUserProvidedServiceInstanceRelations, // Per action builder
      true// Per action builder
    ).monitor.currentPage$.subscribe(a => console.log('allInSpacePagMonitor: ', a));

    const allInSpacePagObservables = this.userProvidedServiceEntity.api.custom.getAllInSpace(
      this.ech,
      endpointGuid, // Per action builder
      spaceGuid, // Per action builder
      null, // Per action builder
      getUserProvidedServiceInstanceRelations, // Per action builder
      true// Per action builder
    ).obs.entities$.subscribe(a => console.log('allInSpacePagObservables: ', a));

    const updateAction = this.userProvidedServiceEntity.actionBuilders.update(
      upsiGuid, // Per action builder
      endpointGuid, // Per action builder
      {} as Partial<IUserProvidedServiceInstanceData> // Per action builder
    );
    // this.store.dispatch(updateAction);
  }

  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {

    const actionBuilder = this.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(cfGuid, spaceGuid, null, relations, true);
    // const action = new GetAllU
    const pagObs = getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        action,
        action.flattenPagination
      )
    }, action.flattenPagination);
    return combineLatest([
      pagObs.entities$, // Ensure entities is subbed to the fetch kicks off
      pagObs.fetchingEntities$
    ]).pipe(
      filter(([, fetching]) => !fetching),
      map(([entities]) => entities)
    );
  }

  public fetchUserProvidedServiceInstancesCount(cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;
    const actionBuilder = this.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(
      createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
      cfGuid,
      { includeRelations: [], populateMissing: false }
    ) as PaginatedAction;
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, QParamJoiners.in).toString());
    }
    return fetchTotalResults(action, this.store, this.paginationMonitorFactory);
  }

  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedServiceInstance>> {
    const actionBuilder = this.userProvidedServiceEntity.actionOrchestrator.getActionBuilder('get');
    const getUserProvidedServiceAction = actionBuilder(upsGuid, cfGuid);
    const service = this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
      upsGuid,
      getUserProvidedServiceAction
    );
    return service.waitForEntity$.pipe(
      map(e => e.entity)
    );
  }

  public createUserProvidedService(
    cfGuid: string,
    guid: string,
    data: IUserProvidedServiceInstanceData
  ): Observable<RequestInfoState> {
    const action = new CreateUserProvidedServiceInstance(cfGuid, guid, data, this.userProvidedServiceInstancesEntityConfig);
    const create$ = this.store.select(selectCfRequestInfo(userProvidedServiceInstanceEntityType, guid));
    this.store.dispatch(action);
    return create$.pipe(
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
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<RequestInfoState> {
    this.userProvidedServiceEntity.actionDispatchManager.dispatchUpdate(
      guid,
      cfGuid,
      data,
      this.userProvidedServiceInstancesEntityConfig
    );
    return this.userProvidedServiceEntity.api.getEntityMonitor(
      this.ech,
      guid
    ).entityRequest$.pipe(
      filter(v => !!v.updating[UpdateUserProvidedServiceInstance.updateServiceInstance]),
      pairwise(),
      filter(([oldV, newV]) =>
        oldV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy &&
        !newV.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy),
      map(([, newV]) => newV)
    );
  }

}


// OLD WAYS
    // const entMon = this.userProvidedServiceEntity.getEntityMonitor(
    //   this.ech,
    //   upsiGuid,
    // );

    // const entService = this.userProvidedServiceEntity.getEntityService(
    //   this.ech,
    //   upsiGuid, // Per action builder
    //   endpointGuid // Per action builder
    // );
    // const entServiceByAction = this.userProvidedServiceEntity.getEntityServiceByAction(
    //   this.ech,
    //   this.userProvidedServiceEntity.buildAction.get(
    //     upsiGuid, // Per action builder
    //     endpointGuid, // Per action builder,
    //     {
    //       includeRelations: [],
    //       populateMissing: true
    //     }// Per action builder,
    //   )
    // );




    // const updateAction = this.userProvidedServiceEntity.createAction(
    //   'update',
    //   upsiGuid, // Per action builder
    //   endpointGuid, // Per action builder
    //   {} as Partial<IUserProvidedServiceInstanceData>, // Per action builder
    // );
    // this.store.dispatch(updateAction);

    // Alt approach?
    // this.entityCatalogService.getPaginationMonitor(
    //   this.userProvidedServiceEntity,
    //   'getAllInSpace',
    //   cfGuid, // Per action builder
    //   spaceGuid, // Per action builder
    //   null, // Per action builder
    //   relations, // Per action builder
    //   true // Per action builder
    // )
