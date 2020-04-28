import { FilteredByReturnType, KnownKeys, NeverKeys } from '../../../../core/src/core/utils.service';
import { EntityService } from '../../entity-service';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { PaginatedAction } from '../../types/pagination.types';
import { OrchestratedActionBuilders, OrchestratedActionCoreBuilders } from '../action-orchestrator/action-orchestrator';

/**
 * Filter out all common builders in OrchestratedActionCoreBuilders from ABC
 */
type CustomBuilders<ABC> = Omit<Pick<ABC, KnownKeys<ABC>>, keyof OrchestratedActionCoreBuilders>;

/**
 * Filter out builders that don't return pagination actions from ABC
 */
export type PaginationBuilders<ABC extends OrchestratedActionBuilders> = FilteredByReturnType<CustomBuilders<ABC>, PaginatedAction>;

export interface EntityAccess<Y, ABC extends OrchestratedActionBuilders> {
  /**
   * // TODO: RC Add Comments to all of these
   */
  getEntityMonitor: (
    entityId: string,
    params?: {
      schemaKey?: string,
      startWithNull?: boolean
    }
  ) => EntityMonitor<Y>;
  getEntityService: (
    ...args: Parameters<ABC['get']>
  ) => EntityService<Y>;
  getPaginationMonitor: (
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationMonitor<Y>;
  getPaginationService: (
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationObservables<Y>;
  // instances: EntityInstances<Y, PaginationBuilders<ABC>>;
}

type PaginatedActionBuilders<ABC extends OrchestratedActionBuilders> = Omit<PaginationBuilders<ABC>, NeverKeys<PaginationBuilders<ABC>>>
export type EntityCatalogStore<Y, ABC extends OrchestratedActionBuilders> = EntityAccess<Y, ABC> & EntityCustomAccess<Y, PaginatedActionBuilders<ABC>>




export type EntityCustomAccess<Y, ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: {
    getPaginationMonitor: (
      ...args: Parameters<ABC[K]>
    ) => PaginationMonitor<Y>;
    getPaginationService: (
      ...args: Parameters<ABC[K]>
    ) => PaginationObservables<Y>;
  }
};