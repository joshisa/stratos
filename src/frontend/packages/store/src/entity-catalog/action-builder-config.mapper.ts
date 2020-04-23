import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EntitySchema } from '../helpers/entity-schema';
import { PaginationMonitor } from '../monitors/pagination-monitor';
import { ActionState, RequestInfoState } from '../reducers/api-request-reducer/types';
import { getCurrentPageRequestInfo, PaginationObservables } from '../reducers/pagination-reducer/pagination-reducer.helper';
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
  PaginationRequestActionConfig,
} from './action-orchestrator/action-orchestrator';
import { EntityAccess, EntityAccessPagination } from './entity-catalog-entity';
import { EntityCatalogHelper } from './entity-catalog.service';

// K extends keyof ABC
type ActionDispatcher<K extends keyof ABC, ABC extends OrchestratedActionBuilders> = (
  ech: EntityCatalogHelper,
  ...args: Parameters<ABC[K]>
) => Observable<RequestInfoState | ActionState>;
export type ActionDispatchers<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionDispatcher<K, ABC>
};

// export interface EntityInstance<Y, ABC extends OrchestratedActionBuilders> {
//   getEntityMonitor: (
//     helper: EntityCatalogHelper,
//     entityId: string,
//     params?: {
//       schemaKey?: string,
//       startWithNull?: boolean
//     }
//   ) => EntityMonitor<Y>;
//   getEntityService: (
//     helper: EntityCatalogHelper,
//     ...args: Parameters<ABC['get']>
//   ) => EntityService<Y>;
// }


export type EntityInstances<Y, ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: {
    getPaginationMonitor: (
      helper: EntityCatalogHelper,
      ...args: Parameters<ABC[K]>
    ) => PaginationMonitor<Y>;
    getPaginationService: (
      helper: EntityCatalogHelper,
      ...args: Parameters<ABC[K]>
    ) => PaginationObservables<Y>;
  }
};

// type ActionStore<K extends keyof ABC, ABC extends OrchestratedActionBuilders, Y = any> = (
//   ech: EntityCatalogHelper,
//   ...args: Parameters<ABC[K]>
// ) => EntityAccessPagination<Y> | EntityAccessEntity<Y>;
// export type ActionStores<ABC extends OrchestratedActionBuilders> = {
//   [K in keyof ABC]: ActionStore<K, ABC>
// };

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
  ): EntityInstances<Y, ABC> {
    if (!builders) {
      return {} as EntityInstances<Y, ABC>;
    }
    return Object.keys(builders).reduce((entityInstances, key) => {
      return {
        ...entityInstances,
        [key]: {
          getPaginationMonitor: (
            helper: EntityCatalogHelper,
            ...args: Parameters<ABC[K]>
          ) => {
            const action = builders[key](...args);
            if (!isPaginatedAction(action)) {
              throw new Error(`\`${key}\` action is not of type pagination`);
            }
            const pAction = action as PaginatedAction;
            return helper.pmf.create<Y>(pAction.paginationKey, pAction, pAction.flattenPagination);
          },
          getPaginationService: (
            helper: EntityCatalogHelper,
            ...args: Parameters<ABC[K]>
          ) => {
            const action = builders[key](...args);
            if (!isPaginatedAction(action)) {
              throw new Error(`\`${key}\` action is not of type pagination`);
            }
            const pAction = action as PaginatedAction;
            return helper.getPaginationObservables<Y>({
              store: helper.store,
              action: pAction,
              paginationMonitor: helper.pmf.create<Y>(
                pAction.paginationKey,
                pAction,
                pAction.flattenPagination
              )
            }, pAction.flattenPagination);  // TODO: RC REF This isn't always the case.
          }
        }
      };
    }, {} as EntityInstances<Y, ABC>);
  }

  static getActionDispatchers<Y, ABC extends OrchestratedActionBuilders>(
    es: EntityAccess<Y, ABC>,
    builders: ABC,
  ): ActionDispatchers<ABC> {
    if (!builders) {
      return {} as ActionDispatchers<ABC>;
    }
    return Object.keys(builders).reduce((actionDispatchers, key) => {
      return {
        ...actionDispatchers,
        [key]: ActionBuilderConfigMapper.getActionDispatcher(
          es,
          builders[key],
          key
        )
      };
    }, {} as ActionDispatchers<ABC>);
  }

  static getActionDispatcher<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    es: EntityAccess<Y, ABC>,
    builder: OrchestratedActionBuilder, // TODO: RC support | OrchestratedActionBuilderConfig
    actionKey: string,
  ): ActionDispatcher<K, ABC> {
    return (
      ech: EntityCatalogHelper,
      ...args: Parameters<ABC[K]>) => {
      const action = builder(...args);
      ech.store.dispatch(action);
      if (isPaginatedAction(action)) {
        const pagObs = es.instances[actionKey] as unknown as EntityAccessPagination<Y>;
        return pagObs.monitor.pagination$.pipe(map(p => getCurrentPageRequestInfo(p)));
      }
      const rAction = action as RequestAction;
      return es.getEntityMonitor(
        ech,
        rAction.guid,
        {
          schemaKey: rAction.entity[0] || rAction.entity,
          startWithNull: true
        }
      ).entityRequest$;
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
