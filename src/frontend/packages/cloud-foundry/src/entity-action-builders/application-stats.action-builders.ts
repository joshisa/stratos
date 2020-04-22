import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppStatsAction } from '../actions/app-metadata.actions';

export interface AppStatsActionBuilders extends OrchestratedActionBuilders {
  get: (appGuid, endpointGuid) => GetAppStatsAction;
};

export const appStatsActionBuilders: AppStatsActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppStatsAction(appGuid, endpointGuid)
};
