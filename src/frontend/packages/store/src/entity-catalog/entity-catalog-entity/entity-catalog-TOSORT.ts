import { Observable } from 'rxjs';

import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { ListActionState, RequestInfoState } from '../../reducers/api-request-reducer/types';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { isPaginatedAction, PaginatedAction } from '../../types/pagination.types';
import { RequestAction } from '../../types/request.types';
import { OrchestratedActionBuilder, OrchestratedActionBuilders } from '../action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from '../entity-catalog.helper';
import { EntityAccess, EntityCatalogStore } from './entity-catalog-entity.types';

type ActionDispatcher<K extends keyof ABC, ABC extends OrchestratedActionBuilders> = <T extends RequestInfoState | ListActionState>(
  ...args: Parameters<ABC[K]>
) => Observable<T>;
export type ActionDispatchers<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionDispatcher<K, ABC>
};

// TODO: RC
export class EntityCatalogTOSORT {
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
    es: EntityCatalogStore<Y, ABC>,
    builders: ABC,
  ): ActionDispatchers<ABC> {
    if (!builders) {
      return {} as ActionDispatchers<ABC>;
    }
    return Object.keys(builders).reduce((actionDispatchers, key) => {

      return {
        ...actionDispatchers,
        [key]: EntityCatalogTOSORT.getActionDispatcher(
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
}