import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../app-state';
import { EntityServiceFactory } from '../entity-service-factory.service';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';

@Injectable()
export class EntityCatalogHelper {

  constructor(
    public esf: EntityServiceFactory,
    public pmf: PaginationMonitorFactory,
    public store: Store<AppState>,
  ) {

  }

}
