import { FilteredByValueType, JustMethodKeys, NeverKeys } from '../../../core/src/core/utils.service';
import {
  CustomBuilders,
  EntityInstances,
  PaginationBuilders,
} from '../../../store/src/entity-catalog/action-builder-config.mapper';
import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesDelete, AppVariablesEdit } from '../actions/app-variables.actions';
import { ListAppEnvVar } from '../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import { UserProvidedServiceActionBuilder } from './user-provided-service.action-builders';

type q = PaginationBuilders<UserProvidedServiceActionBuilder>;
type w = CustomBuilders<UserProvidedServiceActionBuilder>;
type e = UserProvidedServiceActionBuilder;
type r = EntityInstances<any, q>;
const rr: r;
rr.



// type store<Y, ABC> = EntityAccess<Y, ABC> & EntityInstances<Y, PaginationBuilders<ABC>>;
// type aaaaa<ABC> = EntityAccess<Y, ABC>;
// type bbbbb<ABC> = EntityInstances<Y, PaginationBuilders<ABC>>;
type ccccc<ABC extends OrchestratedActionBuilders> = PaginationBuilders<ABC>;
const c: ccccc<UserProvidedServiceActionBuilder>;
type eeeee = NeverKeys<ccccc<UserProvidedServiceActionBuilder>>


type ddddd = ccccc<UserProvidedServiceActionBuilder>
type a = FilteredByValueType<ccccc<UserProvidedServiceActionBuilder>, never>;

type b = FilteredByValueType<ddddd, never>;
const bb: b;


// type JustMethodKeys<T> = ({ [P in keyof T]: T[P] extends never ? never : P })[keyof T];
// type JustMethods<T> = Pick<T, JustMethodKeys<T>>;
type c<ABC> = JustMethodKeys<ABC>;
type d = c<UserProvidedServiceActionBuilder>;

type fffff<ABC extends {}> = NeverKeys<ABC>;
type ggggg = Omit<q, fffff<q>>;
type hhhhh<ABC extends OrchestratedActionBuilders> = Omit<PaginationBuilders<ABC>, NeverKeys<PaginationBuilders<ABC>>>;
type iiiii = hhhhh<UserProvidedServiceActionBuilder>;



export interface AppEnvVarActionBuilders extends OrchestratedActionBuilders {
  get: (appGuid, endpointGuid) => GetAppEnvVarsAction;
  removeFromApplication: (
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    selectedItems: ListAppEnvVar[]
  ) => AppVariablesDelete;
  editInApplication: (
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    editedEnvVar: ListAppEnvVar
  ) => AppVariablesEdit;
  addNewToApplication: (
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    newEnvVar: ListAppEnvVar
  ) => AppVariablesAdd;
}

// App variables are a special case where the entities are actually embedded in an application
// This means that most actions are not standard api actions.
export const appEnvVarActionBuilders: AppEnvVarActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppEnvVarsAction(appGuid, endpointGuid),
  removeFromApplication: (
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    selectedItems: ListAppEnvVar[]
  ) => new AppVariablesDelete(endpointGuid, appGuid, allEnvVars, selectedItems),
  editInApplication: (
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    editedEnvVar: ListAppEnvVar
  ) => new AppVariablesEdit(endpointGuid, appGuid, allEnvVars, editedEnvVar),
  addNewToApplication: (
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    newEnvVar: ListAppEnvVar
  ) => new AppVariablesAdd(endpointGuid, appGuid, allEnvVars, newEnvVar)
};

// // const a: Omit<AppEnvVarActionBuilders, 'get'>;
// type wnkbg = Omit<{
//   get: string;
//   remove: string;
// }, keyof {
//   get: boolean;
// }>;
// const todo2: wnkbg;
// todo2.;

// interface Todo {
//   title: string;
//   description: string;
//   completed: boolean;
// }

// type TodoPreview = Omit<AppEnvVarActionBuilders, keyof asdsadsad>;
// const todo: TodoPreview;
// todo.;

// type TodoPreview2 = Extract<AppEnvVarActionBuilders,
//   Omit<OrchestratedActionBuilders, keyof OrchestratedActionCoreBuilders>>;
// const todo3: TodoPreview2;
// todo3.;
