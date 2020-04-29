import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { ServicesService } from '../services.service';

export function servicesServiceFactory(
  store: Store<CFAppState>,
  activatedRoute: ActivatedRoute,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  return new ServicesService(store, activatedRoute, paginationMonitorFactory);
}


@Component({
  selector: 'app-service-base',
  templateUrl: './service-base.component.html',
  styleUrls: ['./service-base.component.scss'],
  providers: [
    {
      provide: ServicesService,
      useFactory: servicesServiceFactory,
      deps: [Store, ActivatedRoute, PaginationMonitorFactory]
    }
  ]
})
export class ServiceBaseComponent { }
