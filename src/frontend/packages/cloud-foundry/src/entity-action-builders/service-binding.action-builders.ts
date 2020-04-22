import { IServiceBinding } from '../../../core/src/core/cf-api-svc.types';
import { EntityAccessPagination, EntityApiCustom } from '../../../store/src/entity-catalog/entity-catalog-entity';
import { EntityCatalogHelper } from '../../../store/src/entity-catalog/entity-catalog.service';
import { APIResource } from '../../../store/src/types/api.types';
import { GetAppServiceBindings } from '../actions/application-service-routes.actions';
import { CreateServiceBinding, DeleteServiceBinding, FetchAllServiceBindings } from '../actions/service-bindings.actions';
import { ListServiceBindingsForInstance } from '../actions/service-instances.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';

export interface ServiceBindingApiCustom extends EntityApiCustom {
  getAllForApplication: (
    ech: EntityCatalogHelper,
    applicationGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => EntityAccessPagination<APIResource<IServiceBinding>>;
  getAllForServiceInstance: (
    ech: EntityCatalogHelper,
    serviceInstanceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }: CFBasePipelineRequestActionMeta
  ) => EntityAccessPagination<APIResource<IServiceBinding>>;
}

export interface ServiceBindingActionBuilders extends CFOrchestratedActionBuilders {
  create: (
    id: string,
    endpointGuid: string,
    { applicationGuid, serviceInstanceGuid, params }: { applicationGuid: string, serviceInstanceGuid: string, params: object }
  ) => CreateServiceBinding;
  remove: (
    guid: string,
    endpointGuid: string,
    { serviceInstanceGuid }: { serviceInstanceGuid: string }
  ) => DeleteServiceBinding;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => FetchAllServiceBindings;
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAppServiceBindings;
  getAllForServiceInstance: (
    serviceInstanceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }: CFBasePipelineRequestActionMeta
  ) => ListServiceBindingsForInstance;
}

export const serviceBindingActionBuilders: ServiceBindingActionBuilders = {
  create: (
    id,
    endpointGuid,
    { applicationGuid, serviceInstanceGuid, params }: { applicationGuid: string, serviceInstanceGuid: string, params: object }
  ) => new CreateServiceBinding(
    endpointGuid,
    id,
    applicationGuid,
    serviceInstanceGuid,
    params
  ),
  remove: (
    guid,
    endpointGuid,
    { serviceInstanceGuid }: { serviceInstanceGuid: string }
  ) => new DeleteServiceBinding(endpointGuid, guid, serviceInstanceGuid),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new FetchAllServiceBindings(
    endpointGuid,
    paginationKey,
    includeRelations,
    populateMissing
  ),
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAppServiceBindings(applicationGuid, endpointGuid, paginationKey, includeRelations, populateMissing),
  getAllForServiceInstance: (
    serviceInstanceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    { includeRelations }: CFBasePipelineRequestActionMeta = {}
  ) => new ListServiceBindingsForInstance(
    endpointGuid,
    serviceInstanceGuid,
    paginationKey,
    includeRelations
  )
};


