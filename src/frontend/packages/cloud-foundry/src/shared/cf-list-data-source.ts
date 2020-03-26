import { ListDataSource } from '../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  IListDataSourceConfig,
} from '../../../core/src/shared/components/list/data-sources-controllers/list-data-source-config';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog.service';
import { QParam } from './q-param';

export abstract class CFListDataSource<T, A = T> extends ListDataSource<T, A> {

  constructor(config: IListDataSourceConfig<A, T>) {
    super(config);

    if (config.isLocal) {
      const entityConfig = entityCatalog.getEntity(config.action);
      // config.store.dispatch(
      //   new SetPaginationMax(999, this.entityType, this.endpointType, this.paginationKey, null) // TODO: RC null
      // );
      // entityConfig.definition.paginationConfig
    }


    // TODO: RC find all flattenPagMax uses
    // config.store.select()
  }

  protected setQParam(setQ: QParam, qs: QParam[]): boolean {
    const existing = qs.find((q: QParam) => q.key === setQ.key);
    let changed = true;
    if (setQ.value && setQ.value.length) {
      if (existing) {
        // Set existing value
        changed = existing.value !== setQ.value;
        existing.value = setQ.value;
      } else {
        // Add new value
        qs.push(setQ);
      }
    } else {
      if (existing) {
        // Remove existing
        qs.splice(qs.indexOf(existing), 1);
      } else {
        changed = false;
      }
    }
    return changed;
  }
}
