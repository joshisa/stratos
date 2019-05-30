import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { CloudFoundryOrgSpaceQuotasComponent } from './cloud-foundry-organization-space-quotas.component';

describe('CloudFoundryOrgSpaceQuotasComponent', () => {
  let component: CloudFoundryOrgSpaceQuotasComponent;
  let fixture: ComponentFixture<CloudFoundryOrgSpaceQuotasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrgSpaceQuotasComponent],
      providers: [CfOrgsListConfigService, generateTestCfEndpointServiceProvider(), TabNavService],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrgSpaceQuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
