import { EntitySchema } from '../../helpers/entity-schema';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import {
  BaseEntityRequestAction,
  BaseEntityRequestConfig,
  BasePaginationRequestAction,
  EntityRequestActionConfig,
  GetMultipleActionBuilder,
  KnownEntityActionBuilder,
  OrchestratedActionBuilder,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
  PaginationRequestActionConfig,
} from '../action-orchestrator/action-orchestrator';
import { EntityCustomAccess, PaginationBuilders } from './entity-catalog-entity.types';
import { EntityCatalogTOSORT } from './entity-catalog-TOSORT';


// TODO: RC TIDY THIS WHOLE MESS. SPLIT OUT


export class ActionBuilderConfigMapper {

  // TODO: RC understand and use?
  static actionKeyHttpMethodMapper = {
    get: 'GET',
    getMultiple: 'GET',
    create: 'POST',
    remove: 'DELETE',
    update: 'PUT'
  };

  static getEntityInstances<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    builders: ABC,
  ): EntityCustomAccess<Y, PaginationBuilders<ABC>> {
    if (!builders) {
      return {} as EntityCustomAccess<Y, ABC>;
    }
    return Object.keys(builders).reduce((entityInstances, key) => {
      // This isn't smart like the PaginationBuilders type. Here key will be all properties from an action builder (get, getMultiple, etc)
      // which will be available from the dev console. Attempting to use in code pre-transpile will result in error
      return {
        ...entityInstances,
        [key]: {
          getPaginationMonitor: (
            ...args: Parameters<ABC[K]>
          ): PaginationMonitor<Y> => {
            return EntityCatalogTOSORT.createPaginationMonitor(
              key,
              builders[key](...args)
            );
          },
          getPaginationService: (
            ...args: Parameters<ABC[K]>
          ): PaginationObservables<Y> => {
            return EntityCatalogTOSORT.createPaginationService(
              key,
              builders[key](...args)
            );
          }
        }
      };
    }, {} as EntityCustomAccess<Y, PaginationBuilders<ABC>>);
  }

  static getActionBuilders(
    builders: OrchestratedActionBuilders | OrchestratedActionBuilderConfig,
    endpointType: string,
    entityType: string,
    schemaGetter: (schemaKey: string) => EntitySchema
  ): OrchestratedActionBuilders {
    if (!builders) {
      return {};
    }
    return Object.keys(builders).reduce((actionBuilders, key) => {
      return {
        ...actionBuilders,
        [key]: ActionBuilderConfigMapper.getActionBuilder(builders[key], key, endpointType, entityType, schemaGetter)
      };
    }, {} as OrchestratedActionBuilders);
  }

  static getActionBuilder(
    configOrBuilder: OrchestratedActionBuilder |
      EntityRequestActionConfig<OrchestratedActionBuilder> |
      PaginationRequestActionConfig<OrchestratedActionBuilder>,
    actionKey: string,
    endpointType: string,
    entityType: string,
    schemaGetter: (schemaKey: string) => EntitySchema
  ): OrchestratedActionBuilder {
    if (configOrBuilder instanceof EntityRequestActionConfig) {
      return (...args: Parameters<KnownEntityActionBuilder>) => {
        const [guid, endpointGuid, ...meta] = args;
        return new BaseEntityRequestAction(
          schemaGetter(configOrBuilder.schemaKey),
          guid,
          endpointGuid,
          entityType,
          endpointType,
          configOrBuilder.getUrl(...args),
          ActionBuilderConfigMapper.addHttpMethodFromActionKey(actionKey, configOrBuilder.requestConfig),
          meta,
          configOrBuilder.externalRequest
        );
      };
    }
    if (configOrBuilder instanceof PaginationRequestActionConfig) {
      return (...args: Parameters<GetMultipleActionBuilder>) => {
        const [endpointGuid, ...meta] = args;
        return new BasePaginationRequestAction(
          schemaGetter(configOrBuilder.schemaKey),
          configOrBuilder.paginationKey || args[1],
          endpointGuid,
          entityType,
          endpointType,
          configOrBuilder.getUrl(...args),
          configOrBuilder.requestConfig,
          meta,
          !configOrBuilder.externalRequest
        );
      };
    }
    return configOrBuilder;
  }

  static addHttpMethodFromActionKey(key: string, config: BaseEntityRequestConfig): BaseEntityRequestConfig {
    return {
      ...config,
      // The passed httpMethod takes precedence when we're mapping the update action.
      // This is because some apis might use POST for updates.
      httpMethod: key === 'update' ? config.httpMethod || ActionBuilderConfigMapper.actionKeyHttpMethodMapper[key] :
        ActionBuilderConfigMapper.actionKeyHttpMethodMapper[key] || config.httpMethod,
    };
  }
}
