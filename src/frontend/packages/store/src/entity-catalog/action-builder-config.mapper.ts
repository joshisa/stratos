import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EntitySchema } from '../helpers/entity-schema';
import { ActionState, RequestInfoState } from '../reducers/api-request-reducer/types';
import { getCurrentPageRequestInfo } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { isPaginatedAction } from '../types/pagination.types';
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
import { EntityAccessEntity, EntityAccessPagination, EntityStorage } from './entity-catalog-entity';
import { EntityCatalogHelper } from './entity-catalog.service';

// K extends keyof ABC
type ActionDispatcher<K extends keyof ABC, ABC extends OrchestratedActionBuilders> = (
  ech: EntityCatalogHelper,
  ...args: Parameters<ABC[K]>
) => Observable<RequestInfoState | ActionState>;
export type ActionDispatchers<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionDispatcher<K, ABC>
};

type ActionStore<K extends keyof ABC, ABC extends OrchestratedActionBuilders, Y = any> = (
  ech: EntityCatalogHelper,
  ...args: Parameters<ABC[K]>
) => EntityAccessPagination<Y> | EntityAccessEntity<Y>;
export type ActionStores<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionStore<K, ABC>
};

export class ActionBuilderConfigMapper {

  static actionKeyHttpMethodMapper = {
    get: 'GET',
    getMultiple: 'GET',
    create: 'POST',
    remove: 'DELETE',
    update: 'PUT'
  };

  static getActionStores<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    helper: EntityCatalogHelper,
    builders: ABC,
  ): ActionStores<ABC> {
    if (!builders) {
      return {} as ActionStores<ABC>;
    }
    return Object.keys(builders).reduce((actionStorers, key) => {
      return {
        ...actionStorers,
        [key]: ActionBuilderConfigMapper.getActionStore(
          helper,
          builders[key],
          key
        )
      };
    }, {} as ActionStores<ABC>);
  }

  static getActionStore<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    helper: EntityCatalogHelper,
    builder: OrchestratedActionBuilder, // TODO: RC support | OrchestratedActionBuilderConfig
    actionKey: string,
  ): ActionStore<K, ABC> {
    return (
      ech: EntityCatalogHelper,
      ...args: Parameters<ABC[K]>) => {
      const action = builder(...args);
      // TODO: RC discard all none-gets
      if (isPaginatedAction(action)) {
        const mon = 
        }
      return null;


      // const action = builder(...args);
      // if (isPaginatedAction(action)) {
      //   const pagObs = es[actionKey] as unknown as EntityAccessPagination<Y>;
      //   // return pagObs.monitor.pagination$.pipe(map(p => getCurrentPageRequestInfo(p)));
      // }
      // const entObs = es[actionKey] as unknown as EntityAccessEntity<Y>;
      // // return entObs.entityMonitor.entityRequest$; // TODO: RC use actionKeyHttpMethodMapper to get type
    };
  }

  static getActionDispatchers<Y, ABC extends OrchestratedActionBuilders>(
    es: EntityStorage<Y, ABC>,
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
    es: EntityStorage<Y, ABC>,
    builder: OrchestratedActionBuilder, // TODO: RC support | OrchestratedActionBuilderConfig
    actionKey: string,
  ): ActionDispatcher<K, ABC> {
    return (
      ech: EntityCatalogHelper,
      ...args: Parameters<ABC[K]>) => {
      const action = builder(...args);
      ech.store.dispatch(action);
      if (isPaginatedAction(action)) {
        const pagObs = es[actionKey] as unknown as EntityAccessPagination<Y>;
        return pagObs.monitor.pagination$.pipe(map(p => getCurrentPageRequestInfo(p)));
      }
      const entObs = es[actionKey] as unknown as EntityAccessEntity<Y>;
      return entObs.entityMonitor.entityRequest$; // TODO: RC use actionKeyHttpMethodMapper to get type
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
