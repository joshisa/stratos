import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';

export function createCfFeatureFlagFetchAction(cfGuid: string) {
  const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
  const action = cfEntityCatalog.featureFlag.actions.getMultiple(cfGuid, paginationKey)
  action.flattenPagination = true;
  return action;
}
