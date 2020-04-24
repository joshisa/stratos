import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { DeleteApplication } from '../actions/application.actions';
import {
  CreateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
  GetUserProvidedService,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../actions/user-provided-service.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';



export interface UserProvidedServiceActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetUserProvidedService;
  create: (
    endpointGuid: string,
    guid: string,
    data: IUserProvidedServiceInstanceData,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig) => CreateUserProvidedServiceInstance,
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
  create: (
    endpointGuid: string,
    guid: string,
    data: IUserProvidedServiceInstanceData,
    proxyPaginationEntityConfig?: EntityCatalogEntityConfig) =>
    new CreateUserProvidedServiceInstance(endpointGuid, guid, data, proxyPaginationEntityConfig),
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


// TODO: RC Nuke
// type KnownKeys<T> = {
//   [K in keyof T]: string extends K ? never : number extends K ? never : K
// } extends { [_ in keyof T]: infer U } ? U : never;

// // type TodoPreview = Pick<UserProvidedServiceActionBuilder, KnownKeys<OrchestratedActionBuilders>>; intercept
// type b = KnownKeys<UserProvidedServiceActionBuilder>;
// type TodoPreview = Pick<UserProvidedServiceActionBuilder, KnownKeys<UserProvidedServiceActionBuilder>>;
// const todo: TodoPreview;
// todo;
// type TodoPreview2 = Omit<TodoPreview, KnownKeys<OrchestratedActionCoreBuilders>>;
// const todo22: TodoPreview2;
// todo22.;
// type TodoPreview3 = Omit<Pick<UserProvidedServiceActionBuilder, KnownKeys<UserProvidedServiceActionBuilder>>, KnownKeys<OrchestratedActionCoreBuilders>>;
// // type hmm<R = any> = (...any: any[]) => R extends PaginatedAction ? R : never;
// type hmm<R extends PaginatedAction> = (...any: any[]) => R;

// type FilterFlags<Base extends { [key: string]: any }> = {
//   [Key in keyof Base]: ReturnType<Base[Key]> extends PaginatedAction ? Base[Key] : undefined
// };

// type TodoPreview4 = FilterFlags<TodoPreview3>;
// const aaa: TodoPreview4;
// aaa.getAllInSpace();
// aaa.junk;


// type RemoveUndefinable<Type> = {
//   [Key in keyof Type]: undefined extends Type[Key] ? never : Key
// }[keyof Type];
// type RemoveNullableProperties<Type> = {
//   [Key in RemoveUndefinable<Type>]: Type[Key]
// };

// type TodoPreview5 = RemoveUndefinable<TodoPreview4>;
// const aaa5: TodoPreview5;


// type PrimitiveKeys<T> = {
//   [P in keyof T]: Exclude<T[P], never> extends object ? never : P
// }[keyof T];
// type OnlyPrimitives<T> = Pick<T, PrimitiveKeys<T>>;
// type Phase31 = PrimitiveKeys<TodoPreview4>;
// type Phase32 = OnlyPrimitives<TodoPreview4>;

// type Test1 = NonNullable<TodoPreview4>;


// interface Foo {
//   [key: string]: any;
//   bar(): void;
// }
// // type KnownKeys<T> = {
// //   [K in keyof T]: string extends K ? never : number extends K ? never : K
// // } extends { [_ in keyof T]: infer U } ? U : never;
// type FooWithOnlyBar = Pick<Foo, KnownKeys<Foo>>;
// type a = KnownKeys<Foo>;
// const todo35: FooWithOnlyBar;
// todo35.;
// type KnownKeys2<T> = {
//   [K in keyof T]: string extends K ? never : number extends K ? never : K
// } extends { [_ in keyof T]: infer U } ? ({} extends U ? never : U) : never;

// type aa2 = KnownKeys2<UserProvidedServiceActionBuilder>;
// type ab2 = Pick<UserProvidedServiceActionBuilder, aa2>;

// type ba2 = keyof OrchestratedActionCoreBuilders;

// type c2 = Omit<ab2, ba2>;


// type aa<ABC> = keyof ABC;
// type ab<ABC> = Pick<ABC, aa<ABC>>;

// type ba = keyof OrchestratedActionCoreBuilders;

// type c = Omit<ab<UserProvidedServiceActionBuilder>, ba>;


// type sdfdsf = keyof OrchestratedActionCoreBuilders;
// type wankbag = Omit<UserProvidedServiceActionBuilder, keyof OrchestratedActionCoreBuilders>;
// type wankbag2<ABC extends OrchestratedActionCoreBuilders> = Omit<ABC, keyof OrchestratedActionCoreBuilders>;
// const c: wankbag2<UserProvidedServiceActionBuilder>;
// c




// export interface UserProvidedServiceActions {
//   get?: (
//     guid: string,
//     endpointGuid: string,
//     meta?: CFBasePipelineRequestActionMeta
//   ) => GetUserProvidedService;
//   remove: (guid: string, endpointGuid: string) => DeleteApplication;
//   update: (
//     guid: string,
//     endpointGuid: string,
//     existingUserProvidedServiceInstance?: Partial<IUserProvidedServiceInstanceData>,
//     proxyPaginationEntityConfig?: EntityCatalogEntityConfig
//   ) => UpdateUserProvidedServiceInstance;
//   getMultiple: (
//     paginationKey?: string,
//     endpointGuid?: string,
//     { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
//   ) => GetAllUserProvidedServices;
//   getAllInSpace: (
//     endpointGuid: string,
//     spaceGuid: string,
//     paginationKey?: string,
//     includeRelations?: string[],
//     populateMissing?: boolean,
//   ) => GetAllUserProvidedServices;
//   junk: (

//   ) => Action;
// }

// export type UserProvidedServiceActionBuilder = UserProvidedServiceActions & CFOrchestratedActionBuilders;
