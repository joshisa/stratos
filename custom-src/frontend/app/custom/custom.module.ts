import { NgModule } from '@angular/core';

import { CoreModule } from '../core/core.module';
import { CustomizationService, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { AcmeLoginComponent } from './acme-login/acme-login.component';
import { AcmeSupportInfoComponent } from './acme-support-info/acme-support-info.component';

const AcmeCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2020 IBM',
  hasEula: true,
  supportInfoComponent: AcmeSupportInfoComponent,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
  ],
  declarations: [
    AcmeLoginComponent,
  ],
  entryComponents: [
    AcmeLoginComponent,
  ]
})
export class CustomModule {

  constructor(cs: CustomizationService) {
    cs.set(AcmeCustomizations);
  }
}
