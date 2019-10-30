import { IListConfig } from '../../list.component.types';

import { IListDataSourceConfig } from '../../data-sources-controllers/list-data-source-config';

export type ListConfigUpdate<T> = Partial<Pick<IListConfig<T>, 'getDataSource'>>;
export type ListDataSourceConfigUpdate<A, T> = Partial<IListDataSourceConfig<A, T>>;

export interface ListConfigProvider<T, A = T> {
  getListConfig: () => IListConfig<T>;
  updateListConfig: (updates: ListConfigUpdate<T>) => void;
  updateDataSourceConfig: (updates: ListDataSourceConfigUpdate<A, T>) => void;
}
