import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { IQuotaDefinition } from '../../../../../../core/cf-api.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../shared.types';
import { ConfirmationDialogConfig } from '../../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';


@Component({
  selector: 'app-cf-quota-card',
  templateUrl: './cf-quota-card.component.html',
  styleUrls: ['./cf-quota-card.component.scss']
})
export class CfQuotaCardComponent extends CardCell<APIResource<IQuotaDefinition>> {
  cardMenu: MetaCardMenuItem[];
  public entityConfig: ComponentEntityMonitorConfig;
  public favorite: UserFavorite<IFavoriteMetadata>;
  public orgStatus$: Observable<StratosStatus>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<AppState>,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService,
  ) {
    super();

    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_EDIT, this.cfEndpointService.cfGuid)
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_DELETE, this.cfEndpointService.cfGuid)
      }
    ];
  }

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: [
          'cloud-foundry',
          this.cfEndpointService.cfGuid,
          'quota-definitions',
          this.row.metadata.guid,
          'edit-quota'
        ]
      })
    );
  }

  delete = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Organization',
      {
        textToMatch: this.row.entity.name
      },
      'Delete',
      true,
    );
    this.confirmDialog.open(confirmation, () => {
      this.cfEndpointService.deleteOrg(
        this.row.metadata.guid,
        this.cfEndpointService.cfGuid
      );
    });
  }

  goToDetails = () => {
    this.store.dispatch(new RouterNav({
      path: [
        'cloud-foundry',
        this.cfEndpointService.cfGuid,
        'quota-definitions',
        this.row.metadata.guid
      ]
    }));
  }
}
