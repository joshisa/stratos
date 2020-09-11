import { NgModule } from '@angular/core';
import {
  CoreModule,
  CustomizationService,
  CustomizationsMetadata,
  ExtensionService,
  MDAppModule,
  SharedModule,
} from '@stratosui/core';

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
    AcmeSupportInfoComponent
  ],
})
export class CFMRModule {

  constructor(cs: CustomizationService) {
    cs.set(AcmeCustomizations);
  }
}
