import { IUserProvidedServiceInstance } from '../../core/src/core/cf-api-svc.types';
import { StratosBaseCatalogEntity } from '../../store/src/entity-catalog/entity-catalog-entity';
import { APIResource } from '../../store/src/types/api.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
import {
  UserProvidedServiceActionBuilder,
  UserProvidedServiceApiCustom,
} from './entity-action-builders/user-provided-service.action-builders';

export class CfEntityCatalog {
  public entities: StratosBaseCatalogEntity[];

  public userProvidedServiceEntity: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceApiCustom
  >;
  // public userProvidedServiceEntityApi: EntityApiProxy<APIResource<IUserProvidedServiceInstance>, UserProvidedServiceActionBuilder, UserProvidedServiceAccessBuilders>;
}

// export const cfEntityCatalog = () => new CfEntityCatalog();
export const cfEntityCatalog: CfEntityCatalog = new CfEntityCatalog();
