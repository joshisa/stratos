import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { EntityApiCustom } from '../../../store/src/entity-catalog/entity-catalog-entity';
import { EntityCatalogHelper } from '../../../store/src/entity-catalog/entity-catalog.service';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';
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


export interface AppEnvVarActionBuilders extends OrchestratedActionBuilders {
  get: (appGuid, endpointGuid) => GetAppEnvVarsAction;
  // TODO: RC not get multiple???
}

// App variables are a special case where the entities are actually embedded in an application
// This means that most actions are not standard api actions.
export const appEnvVarActionBuilders: AppEnvVarActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppEnvVarsAction(appGuid, endpointGuid),
};
