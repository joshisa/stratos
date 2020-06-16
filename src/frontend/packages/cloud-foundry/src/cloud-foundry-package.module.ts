import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { EntityCatalogModule } from '../../core/src/store/entity-catalog.module';
import { generateCFEntities } from './cf-entity-generator';
import { ActiveRouteCfOrgSpace } from './features/cloud-foundry/cf-page.types';
import { CloudFoundrySharedModule } from './shared/cf-shared.module';
import { CfUserService } from './shared/data-services/cf-user.service';
import { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from './shared/data-services/long-running-cf-op.service';
import { ServiceActionHelperService } from './shared/data-services/service-action-helper.service';
import { CloudFoundryUserProvidedServicesService } from './shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryStoreModule } from './store/cloud-foundry.store.module';
import { cfCurrentUserPermissionsService } from './user-permissions/cf-user-permissions-checkers';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateCFEntities),
    CommonModule,
    SharedModule,
    MDAppModule,
    CloudFoundryStoreModule,
    // FIXME: Ensure that anything lazy loaded is not included here - #3675
    CloudFoundrySharedModule,
    // FIXME: Move cf effects into cf module - #3675
    // EffectsModule.for Root([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],
  providers: [
    ...cfCurrentUserPermissionsService,
    CfUserService,
    CloudFoundryService,
    ServiceActionHelperService,
    LongRunningCfOperationsService,
    CloudFoundryUserProvidedServicesService,
    // TODO: Needs to be in all of the lazy-load modules
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: {}
    },

  ]
})
export class CloudFoundryPackageModule { }
