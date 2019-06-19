import { EntityCatalogueEntityConfig } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { PaginatedAction, PaginationEntityState } from '../../types/pagination.types';

export function paginationStart(state, action): PaginationEntityState {
  const paginatedAction = action.apiAction as PaginatedAction;
  const page = paginatedAction.__forcedPageNumber__ || paginatedAction.pageNumber || state.currentPage;
  const entityConfig = paginatedAction.__forcedPageEntityConfig__ as EntityCatalogueEntityConfig;

  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: true,
        error: false,
        message: '',
        baseEntityConfig: {
          entityType: paginatedAction.entityType,
          endpointType: paginatedAction.endpointType,
          schemaKey: Array.isArray(paginatedAction.entity) && paginatedAction.entity[0] ? paginatedAction.entity[0].schema.key : undefined
        },
        entityConfig: entityConfig ? {
          ...entityConfig
        } : null,
        maxed: false
      }
    }
  };
}
