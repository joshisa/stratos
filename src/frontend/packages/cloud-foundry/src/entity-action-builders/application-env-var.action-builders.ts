import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesDelete, AppVariablesEdit } from '../actions/app-variables.actions';
import { ListAppEnvVar } from '../shared/components/list/list-types/app-variables/cf-app-variables-data-source';

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
