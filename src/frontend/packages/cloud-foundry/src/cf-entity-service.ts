import { IUserProvidedServiceInstance } from '../../core/src/core/cf-api-svc.types';
import { entityCatalog } from '../../store/src/entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../../store/src/entity-catalog/entity-catalog-entity';
import { APIResource } from '../../store/src/types/api.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
import { userProvidedServiceInstanceEntityType } from './cf-entity-types';
import { CF_ENDPOINT_TYPE } from './cf-types';
import {
  UserProvidedServiceAccessBuilders,
  UserProvidedServiceActionBuilder,
} from './entity-action-builders/user-provided-service.action-builders';

export class CfEntityCatalog {
  public entities: StratosBaseCatalogEntity[];

  public userProvidedServiceEntity: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceAccessBuilders
  > = entityCatalog.getEntity<
    IFavoriteMetadata,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceAccessBuilders>(
      CF_ENDPOINT_TYPE,
      userProvidedServiceInstanceEntityType
    );
}

export const cfEntityCatalog = () => new CfEntityCatalog();
// export const cfEntityCatalog: CfEntityCatalog = new CfEntityCatalog();
