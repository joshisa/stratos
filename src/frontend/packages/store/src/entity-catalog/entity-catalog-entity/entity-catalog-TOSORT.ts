import { Observable } from 'rxjs';

import { EntityService } from '../../entity-service';
import { EntitySchema } from '../../helpers/entity-schema';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { ListActionState, RequestInfoState } from '../../reducers/api-request-reducer/types';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { isPaginatedAction, PaginatedAction } from '../../types/pagination.types';
import { RequestAction } from '../../types/request.types';
import {
  ActionOrchestrator,
  OrchestratedActionBuilder,
  OrchestratedActionBuilders,
} from '../action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from '../entity-catalog.helper';
import {
  CoreEntityCatalogEntityStore,
  EntityCatalogEntityStore,
  PaginatedActionBuilders,
  PaginationEntityCatalogEntityStore,
} from './entity-catalog-entity.types';

type ActionDispatcher<K extends keyof ABC, ABC extends OrchestratedActionBuilders> = <T extends RequestInfoState | ListActionState>(
  ...args: Parameters<ABC[K]>
) => Observable<T>;

export type ActionDispatchers<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionDispatcher<K, ABC>
};

// TODO: RC
export class EntityCatalogEntityStoreHelpers {
  static createPaginationMonitor<Y>(
    actionBuilderKey: string,
    action: any,
  ): PaginationMonitor<Y> {
    const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
    if (!isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action is not of type pagination`);
    }
    const pAction = action as PaginatedAction;
    return helper.pmf.create<Y>(pAction.paginationKey, pAction, pAction.flattenPagination);
  }

  static createPaginationService<Y>(
    actionBuilderKey: string,
    action: any,
  ): PaginationObservables<Y> {
    const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
    if (!isPaginatedAction(action)) {
      // TODO: RC push error message check up
      throw new Error(`\`${actionBuilderKey}\` action is not of type pagination`);
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

  static getActionDispatchers<Y, ABC extends OrchestratedActionBuilders>(
    es: EntityCatalogEntityStore<Y, ABC>,
    builders: ABC,
  ): ActionDispatchers<ABC> {
    if (!builders) {
      return {} as ActionDispatchers<ABC>;
    }
    return Object.keys(builders).reduce((actionDispatchers, key) => {

      return {
        ...actionDispatchers,
        [key]: EntityCatalogEntityStoreHelpers.getActionDispatcher(
          es,
          builders[key],
          key
        )
      };
    }, {} as ActionDispatchers<ABC>);
  }

  static getActionDispatcher<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    es: CoreEntityCatalogEntityStore<Y, ABC>,
    builder: OrchestratedActionBuilder, // TODO: RC support | OrchestratedActionBuilderConfig
    actionKey: string,
  ): ActionDispatcher<K, ABC> {
    return <T extends RequestInfoState | ListActionState>(
      ...args: Parameters<ABC[K]>): Observable<T> => {
      const helper = EntityCatalogHelpers.GetEntityCatalogHelper();

      const action = builder(...args);
      helper.store.dispatch(action);
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

  static createCoreStore<Y, ABC extends OrchestratedActionBuilders>(
    actionOrchestrator: ActionOrchestrator<ABC>,
    entityKey: string,
    getSchema: (schema: string) => EntitySchema
  ): CoreEntityCatalogEntityStore<Y, ABC> {
    return {
      getEntityMonitor: (
        entityId: string,
        params = {
          schemaKey: '',
          startWithNull: false
        }
      ): EntityMonitor<Y> =>
        new EntityMonitor<Y>(EntityCatalogHelpers.GetEntityCatalogHelper().store, entityId, entityKey, getSchema(params.schemaKey), params.startWithNull)
      ,
      getEntityService: (
        ...args: Parameters<ABC['get']>
      ): EntityService<Y> => {
        const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
        const actionBuilder = actionOrchestrator.getActionBuilder('get');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        const action = actionBuilder(...args);
        return helper.esf.create<Y>(
          action.guid,
          action
        );
      },
      getPaginationMonitor: (
        ...args: Parameters<ABC['getMultiple']>
      ) => {
        const actionBuilder = actionOrchestrator.getActionBuilder('getMultiple');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        return EntityCatalogEntityStoreHelpers.createPaginationMonitor(
          'getMultiple',
          actionBuilder(...args),
        );
      },
      getPaginationService: (
        ...args: Parameters<ABC['getMultiple']>
      ) => {
        const actionBuilder = actionOrchestrator.getActionBuilder('getMultiple');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        return EntityCatalogEntityStoreHelpers.createPaginationService(
          'getMultiple',
          actionBuilder(...args),
        );
      },
    };
  }

  static getPaginationStore<Y, ABC extends OrchestratedActionBuilders = OrchestratedActionBuilders, K extends keyof ABC = ''>(
    builders: ABC,
  ): PaginationEntityCatalogEntityStore<Y, PaginatedActionBuilders<ABC>> {
    if (!builders) {
      return {} as PaginationEntityCatalogEntityStore<Y, PaginatedActionBuilders<ABC>>;
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
            return EntityCatalogEntityStoreHelpers.createPaginationMonitor(
              key,
              builders[key](...args)
            );
          },
          getPaginationService: (
            ...args: Parameters<ABC[K]>
          ): PaginationObservables<Y> => {
            return EntityCatalogEntityStoreHelpers.createPaginationService(
              key,
              builders[key](...args)
            );
          }
        }
      };
    }, {} as PaginationEntityCatalogEntityStore<Y, PaginatedActionBuilders<ABC>>);
  }
}