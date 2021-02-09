import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';

import { CoreModule } from '../../../core/src/core/core.module';
import { EndpointsService } from '../../../core/src/core/endpoints.service';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { EntityCatalogModule } from '../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../store/src/entity-catalog/entity-catalog.types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import {
  KubernetesSATokenAuthFormComponent,
} from './auth-forms/kubernetes-serviceaccount-auth-form/kubernetes-serviceaccount-auth-form.component';
import { KubeConfigImportComponent } from './kube-config-registration/kube-config-import/kube-config-import.component';
import {
  KubeConfigTableImportStatusComponent,
} from './kube-config-registration/kube-config-import/kube-config-table-import-status/kube-config-table-import-status.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration/kube-config-registration.component';
import {
  KubeConfigSelectionComponent,
} from './kube-config-registration/kube-config-selection/kube-config-selection.component';
import {
  KubeConfigTableCertComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-cert/kube-config-table-cert.component';
import {
  KubeConfigTableNameComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-name/kube-config-table-name.component';
import {
  KubeConfigTableSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-select/kube-config-table-select.component';
import {
  KubeConfigTableSubTypeSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-sub-type-select/kube-config-table-sub-type-select.component';
import {
  KubeConfigTableUserSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-user-select/kube-config-table-user-select.component';
import { KUBERNETES_ENDPOINT_TYPE } from './kubernetes-entity-factory';
import { kubeEntityCatalog } from './kubernetes-entity-generator';
import { KubernetesListConfigService } from './kubernetes-list-service';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesUIConfigService } from './kubernetes-ui-service';
import { KubernetesStoreModule } from './kubernetes.store.module';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(() => kubeEntityCatalog.allKubeEntities()),
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule
  ],
  declarations: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
    KubernetesSATokenAuthFormComponent,
    KubeConfigRegistrationComponent,
    KubeConfigSelectionComponent,
    KubeConfigImportComponent,
    KubeConfigTableSelectComponent,
    KubeConfigTableUserSelectComponent,
    KubeConfigTableImportStatusComponent,
    KubeConfigTableSubTypeSelectComponent,
    KubeConfigTableNameComponent,
    KubeConfigTableCertComponent
  ],
  providers: [
    BaseKubeGuid,
    KubernetesEndpointService,
    KubernetesUIConfigService,
  ],
  entryComponents: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
    KubernetesSATokenAuthFormComponent,
    KubeConfigRegistrationComponent,
    KubeConfigTableSelectComponent,
    KubeConfigTableUserSelectComponent,
    KubeConfigTableImportStatusComponent,
    KubeConfigTableSubTypeSelectComponent,
    KubeConfigTableNameComponent,
    KubeConfigTableCertComponent
  ]
})
export class KubernetesSetupModule {
  constructor(
    endpointService: EndpointsService,
    @Optional() @SkipSelf() parentModule: KubernetesSetupModule
  ) {
    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => kubeEntityCatalog.node.api.healthCheck(endpoint.guid))
      );
    }
  }
}
