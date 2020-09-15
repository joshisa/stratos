import { NgModule, APP_INITIALIZER } from '@angular/core';
import { RouterModule, Routes, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SettingsHttpService } from './settings.http.service';
import { SettingsService } from './settings.service';

export function app_Init(configSvc: SettingsHttpService) {
  var foo = configSvc.initializeApp();
  console.log(configSvc.getSettings());
  return () => {
    return foo;
  }
}

var customRoutes: Routes = [{
  path: 'ocp-console',
  loadChildren: () => import('./nav-extension/nav-extension.module').then(m => m.NavExtensionModule),
  resolve: {
    url: 'externalUrlRedirectResolver'
  },
  data: {
    stratosNavigation: {
      text: 'Try OpenShift',
      matIcon: 'openshift',
      matIconFont: 'stratos-icons'
    },
    externalUrl: 'https://www.openshift.com/try',
  }
}];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
    HttpClientModule,
  ],
  declarations: [],
  providers: [
    SettingsHttpService,
    { provide: APP_INITIALIZER, useFactory: app_Init, deps: [SettingsHttpService], multi: true },
    {
        provide: 'externalUrlRedirectResolver',
        useValue: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
        {
            window.location.href = (route.data as any).externalUrl;
        }
    },
  ]
})
export class CFMRRoutingModule { 

  constructor() {
		console.group("RoutingModule Constructor");
		console.groupEnd();
	}
}
