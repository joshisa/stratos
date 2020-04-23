import { OrchestratedActionCoreBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EntityApiCustom } from '../../../store/src/entity-catalog/entity-catalog-entity';
import { EntityCatalogHelper } from '../../../store/src/entity-catalog/entity-catalog.service';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';
import { AppVariablesAdd } from '../actions/app-variables.actions';
import { ListAppEnvVar } from '../shared/components/list/list-types/app-variables/cf-app-variables-data-source';


export interface AppEnvVarApiCustom extends EntityApiCustom {
  removeFromApplication: (
    helper: EntityCatalogHelper,
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    selectedItems: ListAppEnvVar[]
  ) => void;
  editInApplication: (
    helper: EntityCatalogHelper,
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    editedEnvVar: ListAppEnvVar
  ) => void;
  addNewToApplication: (
    helper: EntityCatalogHelper,
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    newEnvVar: ListAppEnvVar
  ) => void;
}


export interface AppEnvVarActionBuilders extends OrchestratedActionCoreBuilders {
  get: (appGuid, endpointGuid) => GetAppEnvVarsAction;
  // TODO: RC Re-add above
  addNewToApplication: (
    helper: EntityCatalogHelper,
    appGuid,
    endpointGuid,
    allEnvVars: ListAppEnvVar[],
    newEnvVar: ListAppEnvVar
  ) => AppVariablesAdd;
}


// // const a: Omit<AppEnvVarActionBuilders, 'get'>;
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

// type TodoPreview = Omit<AppEnvVarActionBuilders, keyof asdsadsad>;
// const todo: TodoPreview;
// todo.;

// type TodoPreview2 = Extract<AppEnvVarActionBuilders,
//   Omit<OrchestratedActionBuilders, keyof OrchestratedActionCoreBuilders>>;
// const todo3: TodoPreview2;
// todo3.;

// App variables are a special case where the entities are actually embedded in an application
// This means that most actions are not standard api actions.
export const appEnvVarActionBuilders: AppEnvVarActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppEnvVarsAction(appGuid, endpointGuid),
};
