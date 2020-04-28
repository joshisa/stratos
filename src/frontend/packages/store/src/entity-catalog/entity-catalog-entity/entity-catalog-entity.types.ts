import { FilteredByReturnType, KnownKeys, NeverKeys } from '../../../../core/src/core/utils.service';
import { EntityService } from '../../entity-service';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { PaginatedAction } from '../../types/pagination.types';
import { OrchestratedActionBuilders, OrchestratedActionCoreBuilders } from '../action-orchestrator/action-orchestrator';

// TODO: RC tidy up `extends OrchestratedActionBuilders`, could be more specific
/**
 * Core entity and entities access (entity/entities monitors and services)
 */
export interface CoreEntityCatalogEntityStore<Y, ABC extends OrchestratedActionBuilders> {
  /**
   * Return a collection of observables for the given entity id. If the entity is missing is will NOT be fetched
   */
  getEntityMonitor: (
    entityId: string,
    params?: {
      schemaKey?: string,
      startWithNull?: boolean
    }
  ) => EntityMonitor<Y>;
  /**
   * Return a collection of observables for the given entity id. Subscribing to core observables (like entityObs$) will fetch the entity if missing
   */
  getEntityService: (
    params?: EntityCatalogStoreParams,
    ...args: Parameters<ABC['get']>
  ) => EntityService<Y>;
  /**
   * Return a collection of observables for the given collection of entities. If the collection is missing it will NOT be fetched
   */
  getPaginationMonitor: (
    params?: EntityCatalogStoreParams,
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationMonitor<Y>;
  /**
   * Return a collection of observables for the given collection of entities. Subscribing to core (like entities$) will fetch the entity if missing
   */
  getPaginationService: (
    params?: EntityCatalogStoreParams,
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationObservables<Y>;
}

/**
 * Filter out all common builders in OrchestratedActionCoreBuilders from ABC
 */
type CustomBuilders<ABC> = Omit<Pick<ABC, KnownKeys<ABC>>, keyof OrchestratedActionCoreBuilders>;

/**
 * Mark builders that don't return a pagination action as `never`
 */
type PaginatedActionBuildersWithNevers<ABC extends OrchestratedActionBuilders> = FilteredByReturnType<CustomBuilders<ABC>, PaginatedAction>;

/**
 * Filter out builders that don't return pagination actions from ABC
 */
export type PaginatedActionBuilders<ABC extends OrchestratedActionBuilders> = Omit<PaginatedActionBuildersWithNevers<ABC>, NeverKeys<PaginatedActionBuildersWithNevers<ABC>>>

/**
 * Provided a typed way to create pagination monitor/service per action (this ultimately only provides ones for paginated actions)
 */
export type PaginationEntityCatalogEntityStore<Y, ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: {
    getPaginationMonitor: (
      params?: EntityCatalogStoreParams,
      ...args: Parameters<ABC[K]>
    ) => PaginationMonitor<Y>;
    getPaginationService: (
      params?: EntityCatalogStoreParams,
      ...args: Parameters<ABC[K]>
    ) => PaginationObservables<Y>;
  }
};

/**
 * Combine CoreEntityCatalogEntityStore (entity and entities store access) with PaginationEntityCatalogEntityStore (per entity custom entities lists)
 */
export type EntityCatalogEntityStore<Y, ABC extends OrchestratedActionBuilders> = CoreEntityCatalogEntityStore<Y, ABC> & PaginationEntityCatalogEntityStore<Y, PaginatedActionBuilders<ABC>>
