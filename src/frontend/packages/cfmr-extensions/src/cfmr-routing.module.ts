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
            // Define a set of safe domains for redirection
            var safedomains:string[]; 
            safedomains = ["www.openshift.com"];

            // Parse the defined url in the data set
            var redirectURL = new URL((route.data as any).externalUrl);

            // Validate that the defined url redirect is limited to the safe domain array set
            if (safedomains.includes(redirectURL.hostname)) 
            {
                // Safe to redirect
                window.location.href = (route.data as any).externalUrl;
            }
            else
            {
                console.log("Defined data.externalUrl (" + (route.data as any).externalUrl + ") provided for ocp-console redirect is to a domain not contained within the existing safe domain list");
            }
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
