import { userFavoritesPaginationKey } from '../effects/user-favorites-effect';
import { userFavoritesSchemaKey } from '../helpers/entity-factory';
import { UserFavorite } from '../types/user-favorites.types';
import { isIdInPagination } from './pagination.selectors';
export function isFavorite(favorite: UserFavorite) {
  return isIdInPagination(favorite.guid, userFavoritesSchemaKey, userFavoritesPaginationKey);
}
