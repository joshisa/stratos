import {
  OrchestratedActionBuilders,
  OrchestratedActionCoreBuilders,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { DeleteApplication } from '../actions/application.actions';
import {
  GetAllUserProvidedServices,
  GetUserProvidedService,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../actions/user-provided-service.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';



// export interface UserProvidedServiceApiCustom extends EntityApiCustom {
//   getAllInSpace: (
//     helper: EntityCatalogHelper,
//     endpointGuid: string,
//     spaceGuid: string,
//     paginationKey?: string,
//     includeRelations?: string[],
//     populateMissing?: boolean,
//   ) => EntityAccessPagination<APIResource<IUserProvidedServiceInstance>>;
// }


// const a: Omit<AppEnvVarActionBuilders, 'get'>;
// type wnkbg = Omit<{
//   get: string; // TODO: RC Q make mandatory
//   remove: string;
// }, keyof {
//   get: boolean; // TODO: RC Q make mandatory
// }>;
// const todo2: wnkbg;
// todo2.;

// interface Todo {
//   title: string;
//   description: string;
//   completed: boolean;
// }
// type KnownKeys<T> = {
//   [K in keyof T]: string extends K ? never : number extends K ? never : K
// } extends { [_ in keyof T]: infer U } ? U : never;

type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U } ? U : never;

// type TodoPreview = Pick<UserProvidedServiceActionBuilder, KnownKeys<OrchestratedActionBuilders>>; intercept
type b = KnownKeys<UserProvidedServiceActionBuilder>;
type TodoPreview = Pick<UserProvidedServiceActionBuilder, KnownKeys<UserProvidedServiceActionBuilder>>;
const todo: TodoPreview;
todo
type TodoPreview2 = Omit<TodoPreview, KnownKeys<OrchestratedActionCoreBuilders>>;
const todo22: TodoPreview2;
todo22.
type TodoPreview3 = Omit<Pick<UserProvidedServiceActionBuilder, KnownKeys<UserProvidedServiceActionBuilder>>, KnownKeys<OrchestratedActionCoreBuilders>>;


interface Foo {
  [key: string]: any;
  bar(): void;
}
// type KnownKeys<T> = {
//   [K in keyof T]: string extends K ? never : number extends K ? never : K
// } extends { [_ in keyof T]: infer U } ? U : never;
type FooWithOnlyBar = Pick<Foo, KnownKeys<Foo>>;
type a = KnownKeys<Foo>;
const todo35: FooWithOnlyBar;
todo35.


// type TodoPreview2 = Extract<AppEnvVarActionBuilders,
//   Omit<OrchestratedActionBuilders, keyof OrchestratedActionCoreBuilders>>;
// const todo3: TodoPreview2;
// todo3.;


export interface UserProvidedServiceActions {
  get?: (
    guid: string,
    endpointGuid: string,
    meta?: CFBasePipelineRequestActionMeta
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

// export type UserProvidedServiceActionBuilder = UserProvidedServiceActions & CFOrchestratedActionBuilders;

export interface UserProvidedServiceActionBuilder extends OrchestratedActionBuilders {
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
