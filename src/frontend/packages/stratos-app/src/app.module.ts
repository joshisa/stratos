import { NgModule } from '@angular/core';
import { AppComponent, AppModule } from '@stratosui/core';

import { CustomImportModule, CustomRoutingImportModule } from './custom-import.module';

@NgModule({
  declarations: [
  ],
  imports: [
    AppModule,
    CustomImportModule,
    CustomRoutingImportModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class StratosAppModule {}