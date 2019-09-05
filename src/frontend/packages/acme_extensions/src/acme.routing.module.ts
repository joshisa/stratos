import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const customRoutes: Routes = [{
  path: 'example',
  loadChildren: './nav-extension/nav-extension.module#NavExtensionModule',
  data: {
    stratosNavigation: {
      text: 'Example',
      matIcon: 'extension'
    }
  }
}];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class AcmeRoutingModule { }
