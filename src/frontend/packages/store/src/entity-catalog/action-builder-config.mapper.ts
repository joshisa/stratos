import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { FilteredByReturnType, KnownKeys, NeverKeys } from '../../../core/src/core/utils.service';
import { AppState } from '../app-state';
import { EntityService } from '../entity-service';
import { EntitySchema } from '../helpers/entity-schema';
import { EntityMonitor } from '../monitors/entity-monitor';
import { PaginationMonitor } from '../monitors/pagination-monitor';
import { ListActionState, RequestInfoState } from '../reducers/api-request-reducer/types';
import { PaginationObservables } from '../reducers/pagination-reducer/pagination-reducer.types';
import { isPaginatedAction, PaginatedAction } from '../types/pagination.types';
import { RequestAction } from '../types/request.types';
import {
  BaseEntityRequestAction,
  BaseEntityRequestConfig,
  BasePaginationRequestAction,
  EntityRequestActionConfig,
  GetMultipleActionBuilder,
  KnownEntityActionBuilder,
  OrchestratedActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
  OrchestratedActionCoreBuilders,
  PaginationRequestActionConfig,
} from './action-orchestrator/action-orchestrator';
import { EntityCatalogTOSORT } from './entity-catalog-TOSORT';


/**
 * Filter out all common builders in OrchestratedActionCoreBuilders from ABC
 */
export type CustomBuilders<ABC> = Omit<Pick<ABC, KnownKeys<ABC>>, keyof OrchestratedActionCoreBuilders>;

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


// TODO: RC TIDY THIS WHOLE MESS. SPLIT OUT
type ActionDispatcher<K extends keyof ABC, ABC extends OrchestratedActionBuilders> = <T extends RequestInfoState | ListActionState>(
  ...args: Parameters<ABC[K]>
) => Observable<T>;
export type ActionDispatchers<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionDispatcher<K, ABC>
};

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

export class ActionBuilderConfigMapper {

  static actionKeyHttpMethodMapper = {
    get: 'GET',
    getMultiple: 'GET',
    create: 'POST',
    remove: 'DELETE',
    update: 'PUT'
  };

  static getEntityInstances<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    builders: ABC,
  ): EntityCustomAccess<Y, PaginationBuilders<ABC>> {
    if (!builders) {
      return {} as EntityCustomAccess<Y, ABC>;
    }
    return Object.keys(builders).reduce((entityInstances, key) => {
      // This isn't smart like the PaginationBuilders type. Here key will be all properties from an action builder (get, getMultiple, etc)
      // which will be available from the dev console. Attempting to use in code pre-transpile will result in error
      return {
        ...entityInstances,
        [key]: {
          getPaginationMonitor: (
            ...args: Parameters<ABC[K]>
          ): PaginationMonitor<Y> => {
            return EntityCatalogTOSORT.createPaginationMonitor(
              helper,
              key,
              builders[key](...args)
            );
          },
          getPaginationService: (
            ...args: Parameters<ABC[K]>
          ): PaginationObservables<Y> => {
            return EntityCatalogTOSORT.createPaginationService(
              helper,
              key,
              builders[key](...args)
            );
          }
        }
      };
    }, {} as EntityCustomAccess<Y, PaginationBuilders<ABC>>);
  }




  static getActionDispatchers<Y, ABC extends OrchestratedActionBuilders>(
    store: Store<AppState>,
    es: EntityCatalogStore<Y, ABC>,
    builders: ABC,
  ): ActionDispatchers<ABC> {
    if (!builders) {
      return {} as ActionDispatchers<ABC>;
    }
    return Object.keys(builders).reduce((actionDispatchers, key) => {
      return {
        ...actionDispatchers,
        [key]: ActionBuilderConfigMapper.getActionDispatcher(
          store,
          es,
          builders[key],
          key
        )
      };
    }, {} as ActionDispatchers<ABC>);
  }

  static getActionDispatcher<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    store: Store<AppState>,
    es: EntityAccess<Y, ABC>,
    builder: OrchestratedActionBuilder, // TODO: RC support | OrchestratedActionBuilderConfig
    actionKey: string,
  ): ActionDispatcher<K, ABC> {
    return <T extends RequestInfoState | ListActionState>(
      ...args: Parameters<ABC[K]>): Observable<T> => {
      const action = builder(...args);
      store.dispatch(action);
      if (isPaginatedAction(action)) {
        // TODO: RC cf Routes page
        // TODO: RC TEST??
        return es[actionKey].getPaginationMonitor(
          ...args
        ).currentPageState$;
      }
      const rAction = action as RequestAction;
      const schema = rAction.entity ? rAction.entity[0] || rAction.entity : null;
      const schemaKey = schema ? schema.schemaKey : null;
      return es.getEntityMonitor(
        rAction.guid,
        {
          schemaKey,
          startWithNull: true
        }
      ).entityRequest$ as unknown as Observable<T>;
    };
  }

  static getActionBuilders(
    builders: OrchestratedActionBuilders | OrchestratedActionBuilderConfig,
    endpointType: string,
    entityType: string,
    schemaGetter: (schemaKey: string) => EntitySchema
  ): OrchestratedActionBuilders {
    if (!builders) {
      return {};
    }
    return Object.keys(builders).reduce((actionBuilders, key) => {
      return {
        ...actionBuilders,
        [key]: ActionBuilderConfigMapper.getActionBuilder(builders[key], key, endpointType, entityType, schemaGetter)
      };
    }, {} as OrchestratedActionBuilders);
  }

  static getActionBuilder(
    configOrBuilder: OrchestratedActionBuilder |
      EntityRequestActionConfig<OrchestratedActionBuilder> |
      PaginationRequestActionConfig<OrchestratedActionBuilder>,
    actionKey: string,
    endpointType: string,
    entityType: string,
    schemaGetter: (schemaKey: string) => EntitySchema
  ): OrchestratedActionBuilder {
    if (configOrBuilder instanceof EntityRequestActionConfig) {
      return (...args: Parameters<KnownEntityActionBuilder>) => {
        const [guid, endpointGuid, ...meta] = args;
        return new BaseEntityRequestAction(
          schemaGetter(configOrBuilder.schemaKey),
          guid,
          endpointGuid,
          entityType,
          endpointType,
          configOrBuilder.getUrl(...args),
          ActionBuilderConfigMapper.addHttpMethodFromActionKey(actionKey, configOrBuilder.requestConfig),
          meta,
          configOrBuilder.externalRequest
        );
      };
    }
    if (configOrBuilder instanceof PaginationRequestActionConfig) {
      return (...args: Parameters<GetMultipleActionBuilder>) => {
        const [endpointGuid, ...meta] = args;
        return new BasePaginationRequestAction(
          schemaGetter(configOrBuilder.schemaKey),
          configOrBuilder.paginationKey || args[1],
          endpointGuid,
          entityType,
          endpointType,
          configOrBuilder.getUrl(...args),
          configOrBuilder.requestConfig,
          meta,
          !configOrBuilder.externalRequest
        );
      };
    }
    return configOrBuilder;
  }

  static addHttpMethodFromActionKey(key: string, config: BaseEntityRequestConfig): BaseEntityRequestConfig {
    return {
      ...config,
      // The passed httpMethod takes precedence when we're mapping the update action.
      // This is because some apis might use POST for updates.
      httpMethod: key === 'update' ? config.httpMethod || ActionBuilderConfigMapper.actionKeyHttpMethodMapper[key] :
        ActionBuilderConfigMapper.actionKeyHttpMethodMapper[key] || config.httpMethod,
    };
  }
}
