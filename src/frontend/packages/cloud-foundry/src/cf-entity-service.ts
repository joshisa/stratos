import { IUserProvidedServiceInstance } from '../../core/src/core/cf-api-svc.types';
import { StratosBaseCatalogEntity } from '../../store/src/entity-catalog/entity-catalog-entity';
import { APIResource } from '../../store/src/types/api.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
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
  >;
}

// export const cfEntityCatalog = () => new CfEntityCatalog();
export const cfEntityCatalog: CfEntityCatalog = new CfEntityCatalog();
