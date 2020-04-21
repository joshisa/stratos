import { IUserProvidedServiceInstance } from '../../../core/src/core/cf-api-svc.types';
import { GahActionBuilders, GahEntitiesAccess } from '../../../store/src/entity-catalog/entity-catalog-entity';
import { EntityCatalogHelper } from '../../../store/src/entity-catalog/entity-catalog.service';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../store/src/types/api.types';
import { DeleteApplication } from '../actions/application.actions';
import {
  GetAllUserProvidedServices,
  GetUserProvidedService,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../actions/user-provided-service.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';

interface UserProvidedServiceBase {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => any;
  remove: (guid: string, endpointGuid: string) => any;
  update: (
    guid: string,
    endpointGuid: string,
    existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => any;
  getMultiple: (
    paginationKey?: string,
    endpointGuid?: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => any;
  getAllInSpace: (
    endpointGuid: string,
    spaceGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => any;
}




export interface UserProvidedServiceAccessBuilders
  extends GahActionBuilders<APIResource<IUserProvidedServiceInstance>, UserProvidedServiceActionBuilder> {
  getAllInSpace: (
    helper: EntityCatalogHelper,
    endpointGuid: string,
    spaceGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => GahEntitiesAccess<APIResource<IUserProvidedServiceInstance>>;


  // remove: (guid: string, endpointGuid: string) => any; // TODO: RC
  // update: (
  //   guid: string,
  //   endpointGuid: string,
  //   existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
  //   proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  // ) => any; // TODO: RC
  // getMultiple: (
  //   paginationKey?: string,
  //   endpointGuid?: string,
  //   { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  // ) => PaginationObservables<APIResource<IUserProvidedServiceInstance>>;
  // getAllInSpace: (
  //   endpointGuid: string,
  //   spaceGuid: string,
  //   paginationKey?: string,
  //   includeRelations?: string[],
  //   populateMissing?: boolean,
  // ) => PaginationObservables<APIResource<IUserProvidedServiceInstance>>;
}

export interface UserProvidedServiceActionBuilder extends UserProvidedServiceBase, CFOrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetUserProvidedService;
  remove: (guid: string, endpointGuid: string) => DeleteApplication;
  update: (
    guid: string,
    endpointGuid: string,
    existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => UpdateUserProvidedServiceInstance;
  getMultiple: (
    paginationKey?: string,
    endpointGuid?: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAllUserProvidedServices;
  getAllInSpace: (
    endpointGuid: string,
    spaceGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => GetAllUserProvidedServices;
}

export const userProvidedServiceActionBuilder: UserProvidedServiceActionBuilder = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetUserProvidedService(guid, endpointGuid, includeRelations, populateMissing),
  remove: (guid: string, endpointGuid: string) => new DeleteApplication(guid, endpointGuid),
  update: (
    guid: string,
    endpointGuid: string,
    existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) => new UpdateUserProvidedServiceInstance(
    endpointGuid,
    guid,
    existingUserProvidedServiceInstance,
    proxyPaginationEntityConfig
  ),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllUserProvidedServices(paginationKey, endpointGuid, includeRelations, populateMissing),
  getAllInSpace: (
    endpointGuid: string,
    spaceGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetAllUserProvidedServices(paginationKey, endpointGuid, includeRelations, populateMissing, spaceGuid)
};


