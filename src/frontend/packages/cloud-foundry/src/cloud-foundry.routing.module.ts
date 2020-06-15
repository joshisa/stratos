import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const appRoutes: Routes = [
  {
    path: 'applications',
    loadChildren: () => import('../../cloud-foundry/src/features/applications/applications.module').then(m => m.ApplicationsModule),
    data: {
      stratosNavigation: {
        label: 'Applications',
        matIcon: 'apps',
        requiresEndpointType: 'cf',
        position: 20
      }
    },
  },
  {
    path: 'marketplace',
    loadChildren: () => import('../../cloud-foundry/src/features/service-catalog/service-catalog.module')
      .then(m => m.ServiceCatalogModule),
    data: {
      stratosNavigation: {
        label: 'Marketplace',
        matIcon: 'store',
        requiresEndpointType: 'cf',
        position: 30
      }
    },
  },
  {
    path: 'services',
    loadChildren: () => import('../../cloud-foundry/src/features/services/services.module').then(m => m.ServicesModule),
    data: {
      stratosNavigation: {
        label: 'Services',
        matIcon: 'service',
        matIconFont: 'stratos-icons',
        requiresEndpointType: 'cf',
        position: 40
      }
    },
  },
  {
    path: 'cloud-foundry',
    loadChildren: () => import('../../cloud-foundry/src/features/cloud-foundry/cloud-foundry.module').then(m => m.CloudFoundryModule),
    data: {
      stratosNavigation: {
        label: 'Cloud Foundry',
        matIcon: 'cloud_foundry',
        matIconFont: 'stratos-icons',
        requiresEndpointType: 'cf',
        position: 50
      }
    },
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { onSameUrlNavigation: 'reload' }),
  ]
})
export class CloudFoundryRouteModule { }
