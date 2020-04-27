import { KnownKeys, NonOptionalKeys } from '../../../core/src/core/utils.service';
import {
  OrchestratedActionBuilders,
  OrchestratedActionCoreBuilders,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesDelete, AppVariablesEdit } from '../actions/app-variables.actions';
import { ListAppEnvVar } from '../shared/components/list/list-types/app-variables/cf-app-variables-data-source';


type RequiredKeys<T> = { [K in keyof T]-?:
  ({} extends { [P in K]: T[K] } ? never : K)
}[keyof T]

type OptionalKeys<T> = { [K in keyof T]-?:
  ({} extends { [P in K]: T[K] } ? K : never)
}[keyof T]

type ExcludeOptionalProps<T> = Pick<T, RequiredKeys<T>>

type I3 = {
  a: string,
  b?: number,
  c: boolean | undefined
}

type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] };

type I4 = ExcludeOptionalProps<I3>;
type I5 = ExcludeOptionalProps<OrchestratedActionCoreBuilders>;

// type ABC = AppEnvVarActionBuilders;
type sdfsdf = MutableRequired<ABC>;
type optional = OptionalKeys<ABC>;
type known = KnownKeys<ABC>;
type a = Pick<sdfsdf, KnownKeys<ABC>>;
const sdfdsf: a;
sdfdsf.


type OptionalPropNames<T> = { [P in keyof T]: undefined extends T[P] ? P : never }[keyof T];
type RequiredPropNames<T> = { [P in keyof T]: undefined extends T[P] ? never : P }[keyof T];

type OptionalProps<T> = { [P in OptionalPropNames<T>]: T[P] };
type RequiredProps<T> = { [P in RequiredPropNames<T>]: T[P] };

type Foo = {
  a: string;
  b: number;
  c?: string;
  d?: number;
}

type T1 = OptionalPropNames<Foo>;  // { a: string, b: number }
type T2 = RequiredPropNames<Foo>;  // { c?: string | undefined, d?: number | undefined }
const t1i: T1;
t1i.

type NonPartialIsh<ABC> = { [K in keyof ABC]-?: ABC[K] | undefined };
const npi: NonPartialIsh<AppEnvVarActionBuilders>;
npi.
type T3 = Pick<ABC, KnownKeys<NonPartialIsh<ABC>>>;


// type OptionalPropertyOf<T extends object> = Exclude<{
//   [K in keyof T]: T extends Record<K, T[K]>
//     ? never
//     : K
// }[keyof T], undefined>
// type NonOptionalPropertyOf<T extends object> = Exclude<{
//   [K in keyof T]: T extends Record<K, T[K]>
//     ? K
//     : never
// }[keyof T], undefined>

type aa<ABC> = Pick<ABC, KnownKeys<ABC>>;
type bb<ABC extends {}> = NonOptionalKeys<ABC>
type T4 = Pick<AppEnvVarActionBuilders, NonOptionalKeys<aa<AppEnvVarActionBuilders>>>;
type T5<ABC> = Pick<ABC, NonOptionalKeys<Pick<ABC, KnownKeys<ABC>>>>;
type KnownActionBuilders<ABC extends OrchestratedActionBuilders> = Pick<ABC, NonOptionalKeys<Pick<ABC, KnownKeys<ABC>>>>
type i = KnownActionBuilders<AppEnvVarActionBuilders>;

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
