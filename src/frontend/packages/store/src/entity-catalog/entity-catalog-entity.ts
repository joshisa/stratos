import { Action, ActionReducer } from '@ngrx/store';

import { endpointEntitySchema, STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { getFullEndpointApiUrl } from '../../../core/src/features/endpoints/endpoint-helpers';
import { IRequestEntityTypeState } from '../app-state';
import {
  PaginationPageIteratorConfig,
} from '../entity-request-pipeline/pagination-request-base-handlers/pagination-iterator.pipe';
import { EntityPipelineEntity, stratosEndpointGuidKey } from '../entity-request-pipeline/pipeline.types';
import { EntityService } from '../entity-service';
import { EntitySchema } from '../helpers/entity-schema';
import { EntityMonitor } from '../monitors/entity-monitor';
import { PaginationMonitor } from '../monitors/pagination-monitor';
import { PaginationObservables } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { EndpointModel } from '../types/endpoint.types';
import { PaginatedAction } from '../types/pagination.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../types/request.types';
import { IEndpointFavMetadata } from '../types/user-favorites.types';
import { ActionBuilderConfigMapper, ActionDispatchers, EntityInstances } from './action-builder-config.mapper';
import { EntityActionDispatcherManager } from './action-dispatcher/action-dispatcher';
import {
  ActionBuilderAction,
  ActionOrchestrator,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
  OrchestratedActionCoreBuilders,
} from './action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from './entity-catalog.helper';
import { EntityCatalogHelper } from './entity-catalog.service';
import {
  EntityCatalogSchemas,
  IEntityMetadata,
  IStratosBaseEntityDefinition,
  IStratosEndpointDefinition,
  IStratosEntityBuilder,
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from './entity-catalog.types';

// ------------ 1

export function apiCustomDispatch(
  helper: EntityCatalogHelper,
  action: Action
) {
  helper.store.dispatch(action);
}


// TODO: RC TIDY Have this still?
export interface EntityAccessEntity<Y> {
  entityMonitor: EntityMonitor<Y>;
  entityService: EntityService<Y>;
}

// TODO: RC TIDY Have this still?
export interface EntityAccessPagination<Y> {
  monitor: PaginationMonitor<Y>;
  obs: PaginationObservables<Y>;
}

export function createEntityApiPagination<Y>(
  helper: EntityCatalogHelper,
  action: PaginatedAction
): EntityAccessPagination<Y> {
  const mon = helper.pmf.create<Y>(
    action.paginationKey,
    action,
    action.flattenPagination
  );
  return {
    monitor: mon,
    obs: helper.getPaginationObservables<Y>({
      store: helper.store,
      action,
      paginationMonitor: mon
    }, action.flattenPagination) // TODO: RC REF This isn't always the case.
  };
}
export interface EntityApiCustom {
  [others: string]: (
    ...args
  ) => any;
}

type EntityApiProxy<AA extends EntityApiCustom> = {
  [K in keyof AA]: (
    ...args: Parameters<AA[K]>
  ) => ReturnType<AA[K]>
};

export interface EntityApi<Y, ABC extends OrchestratedActionBuilders, AA extends EntityApiCustom> {
  getEntityMonitor: (
    helper: EntityCatalogHelper,
    entityId: string,
    params?: {
      schemaKey?: string,
      startWithNull?: boolean
    }
  ) => EntityMonitor<Y>;
  getEntityService: (
    helper: EntityCatalogHelper,
    ...args: Parameters<ABC['get']>
  ) => EntityService<Y>;
  getPaginationMonitor: (
    helper: EntityCatalogHelper,
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationMonitor<Y>;
  getPaginationService: (
    helper: EntityCatalogHelper,
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationObservables<Y>;
  custom?: EntityApiProxy<AA>;
}



export interface EntityAccess<Y, ABC extends OrchestratedActionBuilders> {
  // instance: EntityInstance<Y, Pick<ABC, 'get'>>;
  getEntityMonitor: (
    helper: EntityCatalogHelper,
    entityId: string,
    params?: {
      schemaKey?: string,
      startWithNull?: boolean
    }
  ) => EntityMonitor<Y>;
  getEntityService: (
    helper: EntityCatalogHelper,
    ...args: Parameters<ABC['get']>
  ) => EntityService<Y>;
  instances: EntityInstances<Y, Omit<ABC, keyof OrchestratedActionCoreBuilders>>;
}




export interface EntityCatalogBuilders<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  AA extends EntityApiCustom = EntityApiCustom, // access builders
  > {
  entityBuilder?: IStratosEntityBuilder<T, Y>;
  // Allows extensions to modify entities data in the store via none API Effect or unrelated actions.
  dataReducers?: ActionReducer<IRequestEntityTypeState<Y>>[];
  actionBuilders?: AB;
  entityAPI?: AA;
}
type DefinitionTypes = IStratosEntityDefinition<EntityCatalogSchemas> |
  IStratosEndpointDefinition<EntityCatalogSchemas> |
  IStratosBaseEntityDefinition<EntityCatalogSchemas>;
export class StratosBaseCatalogEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilderConfig,
  // This typing may cause an issue down the line.
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders,
  AA extends EntityApiCustom = EntityApiCustom, // TODO: RC Comment.. out
  > {

  constructor(
    definition: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition,
    public readonly builders: EntityCatalogBuilders<T, Y, AB, AA> = {}
  ) {
    this.definition = this.populateEntity(definition);
    this.type = this.definition.type || this.definition.schema.default.entityType;
    const baseEntity = definition as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.endpointType = this.getEndpointType(baseEntity);
    // Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
    this.entityKey = this.isEndpoint ?
      EntityCatalogHelpers.buildEntityKey(EntityCatalogHelpers.endpointType, baseEntity.type) :
      EntityCatalogHelpers.buildEntityKey(baseEntity.type, baseEntity.endpoint.type);
    const actionBuilders = ActionBuilderConfigMapper.getActionBuilders(
      this.builders.actionBuilders,
      this.endpointType,
      this.type,
      (schemaKey: string) => this.getSchema(schemaKey)
    );
    const actionDispatchers =
      // this.actionBuilders = actionBuilders as ABC;
      this.actionOrchestrator = new ActionOrchestrator<ABC>(this.entityKey, actionBuilders as ABC); // TODO: RC not public?
    this.actionDispatchManager = this.actionOrchestrator.getEntityActionDispatcher(); // TODO: RC not public?
    this.api = {
      ...this.createEntityAccess(),
      custom: {
        ...this.builders.entityAPI
      }
    };
    // this.api2 = {
    //   ...this.createEntityAccess2(),
    //   ...this.builders.entityAPI
    // };

    this.actions = actionBuilders as ABC;
    // this.storage = ActionBuilderConfigMapper.getActionStorage(this.actions);
    this.storage2 = {
      getEntityMonitor: (
        helper: EntityCatalogHelper,
        entityId: string,
        params = {
          schemaKey: '',
          startWithNull: false
        }
      ): EntityMonitor<Y> => {
        return new EntityMonitor<Y>(helper.store, entityId, this.entityKey, this.getSchema(params.schemaKey), params.startWithNull);
      },
      getEntityService: (
        helper: EntityCatalogHelper,
        ...args: Parameters<ABC['get']>
      ): EntityService<Y> => {
        const actionBuilder = this.actionOrchestrator.getActionBuilder('get');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${this.entityKey}`);
        }
        const action = actionBuilder(...args);
        return helper.esf.create<Y>(
          action.guid,
          action
        );
      },
      instances: ActionBuilderConfigMapper.getEntityInstances(this.actions)
    };
    this.api3 = ActionBuilderConfigMapper.getActionDispatchers(
      this.storage,
      this.actions
    );
  }

  // public readonly actionBuilders: ABC; // TODO: RC TIDY Comments
  public readonly api: EntityApi<Y, ABC, AA>; // TODO: RC TIDY Comments
  // public readonly api2: EntityApi2<Y, ABC>; // & AA

  // v3
  public readonly actions: ABC;
  public readonly api3: ActionDispatchers<ABC>; // EntityApi3<ABC>;
  // public readonly storage: EntityStorage<Y, ABC>;
  public readonly storage2: EntityAccess<Y, ABC>;
  // public readonly storage2: EntityAccess<Y, Exclude<OrchestratedActionBuilders, ABC>>;
  // public readonly storage3: EntityAccess<Y, Omit<ABC, keyof OrchestratedActionCoreBuilders>>;

  public readonly entityKey: string;
  public readonly type: string;
  public readonly definition: DefinitionTypes;
  public readonly isEndpoint: boolean;
  public readonly actionDispatchManager: EntityActionDispatcherManager<ABC>;
  public readonly actionOrchestrator: ActionOrchestrator<ABC>;
  public readonly endpointType: string;

  private createEntityAccess(): EntityApi<Y, ABC, AA> {
    const res: EntityApi<Y, ABC, AA> = {
      getEntityMonitor: (
        helper: EntityCatalogHelper,
        entityId: string,
        params = {
          schemaKey: '',
          startWithNull: false
        }
      ): EntityMonitor<Y> => {
        return new EntityMonitor<Y>(helper.store, entityId, this.entityKey, this.getSchema(params.schemaKey), params.startWithNull);
      },
      getEntityService: (
        helper: EntityCatalogHelper,
        ...args: Parameters<ABC['get']>
      ): EntityService<Y> => {
        const actionBuilder = this.actionOrchestrator.getActionBuilder('get');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${this.entityKey}`);
        }
        const action = actionBuilder(...args);
        return helper.esf.create<Y>(
          action.guid,
          action
        );
      },
      getPaginationMonitor: (
        helper: EntityCatalogHelper,
        ...args: Parameters<ABC['getMultiple']>
      ): PaginationMonitor<Y> => {
        const actionBuilder = this.actionOrchestrator.getActionBuilder('getMultiple');
        if (!actionBuilder) {
          throw new Error(`\`getMultiple\` action builder not implemented for ${this.entityKey}`);
        }
        const action = actionBuilder(...args);
        return helper.pmf.create<Y>(
          action.paginationKey,
          action,
          action.flattenPagination
        );
      },
      getPaginationService: (
        helper: EntityCatalogHelper,
        ...args: Parameters<ABC['getMultiple']>
      ): PaginationObservables<Y> => {
        const actionBuilder = this.actionOrchestrator.getActionBuilder('getMultiple');
        if (!actionBuilder) {
          throw new Error(`\`getMultiple\` action builder not implemented for ${this.entityKey}`);
        }
        const action = actionBuilder(...args);
        return helper.getPaginationObservables<Y>({
          store: helper.store,
          action,
          paginationMonitor: helper.pmf.create<Y>(
            action.paginationKey,
            action,
            action.flattenPagination
          )
        }, action.flattenPagination);  // TODO: RC REF This isn't always the case.
      },
    };
    return res;
  }

  // private createEntityAccess2(): EntityApi2<Y, ABC> {
  //   const res: EntityApi2<Y, ABC> = {
  //     createAction: this.actionBuilders,
  //     execute: {},
  //     getEntityMonitor: (
  //       helper: EntityCatalogHelper,
  //       entityId: string,
  //       params = {
  //         schemaKey: '',
  //         startWithNull: false
  //       }
  //     ): EntityMonitor<Y> => {
  //       return new EntityMonitor<Y>(helper.store, entityId, this.entityKey, this.getSchema(params.schemaKey), params.startWithNull);
  //     },
  //     getEntityService: (
  //       helper: EntityCatalogHelper,
  //       ...args: Parameters<ABC['get']>
  //     ): EntityService<Y> => {
  //       const actionBuilder = this.actionOrchestrator.getActionBuilder('get');
  //       if (!actionBuilder) {
  //         throw new Error(`\`get\` action builder not implemented for ${this.entityKey}`);
  //       }
  //       const action = actionBuilder(...args);
  //       return helper.esf.create<Y>(
  //         action.guid,
  //         action
  //       );
  //     },
  //     getPaginationMonitor: (
  //       helper: EntityCatalogHelper,
  //       ...args: Parameters<ABC['getMultiple']>
  //     ): PaginationMonitor<Y> => {
  //       const actionBuilder = this.actionOrchestrator.getActionBuilder('getMultiple');
  //       if (!actionBuilder) {
  //         throw new Error(`\`getMultiple\` action builder not implemented for ${this.entityKey}`);
  //       }
  //       const action = actionBuilder(...args);
  //       return helper.pmf.create<Y>(
  //         action.paginationKey,
  //         action,
  //         action.flattenPagination
  //       );
  //     },
  //     getPaginationService: (
  //       helper: EntityCatalogHelper,
  //       ...args: Parameters<ABC['getMultiple']>
  //     ): PaginationObservables<Y> => {
  //       const actionBuilder = this.actionOrchestrator.getActionBuilder('getMultiple');
  //       if (!actionBuilder) {
  //         throw new Error(`\`getMultiple\` action builder not implemented for ${this.entityKey}`);
  //       }
  //       const action = actionBuilder(...args);
  //       return helper.getPaginationObservables<Y>({
  //         store: helper.store,
  //         action,
  //         paginationMonitor: helper.pmf.create<Y>(
  //           action.paginationKey,
  //           action,
  //           action.flattenPagination
  //         )
  //       }, action.flattenPagination);  // TODO: RC REF This isn't always the case.
  //     },
  //   };
  //   return res;
  // }

  private populateEntitySchemaKey(entitySchemas: EntityCatalogSchemas): EntityCatalogSchemas {
    return Object.keys(entitySchemas).reduce((newSchema, schemaKey) => {
      if (schemaKey !== 'default') {
        // New schema must be instance of `schema.Entity` (and not a spread of one) else normalize will ignore
        newSchema[schemaKey] = entitySchemas[schemaKey].clone();
        newSchema[schemaKey].schemaKey = schemaKey;
      }
      return newSchema;
    }, {
      default: entitySchemas.default
    });
  }

  private getEndpointType(definition: IStratosBaseEntityDefinition) {
    const entityDef = definition as IStratosEntityDefinition;
    return entityDef.endpoint ? entityDef.endpoint.type : STRATOS_ENDPOINT_TYPE;
  }

  private populateEntity(entity: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition)
    : DefinitionTypes {
    // For cases where `entity.schema` is a EntityCatalogSchemas just pass original object through (with it's default)
    const entitySchemas = entity.schema instanceof EntitySchema ? {
      default: entity.schema
    } : this.populateEntitySchemaKey(entity.schema);

    return {
      ...entity,
      type: entity.type || entitySchemas.default.entityType,
      label: entity.label || 'Unknown',
      labelPlural: entity.labelPlural || entity.label || 'Unknown',
      schema: entitySchemas
    };
  }
  /**
   * Gets the schema associated with the entity type.
   * If no schemaKey is provided then the default schema will be returned
   */
  public getSchema(schemaKey?: string) {
    const catalogSchema = this.definition.schema as EntityCatalogSchemas;
    if (!schemaKey || this.isEndpoint) {
      return catalogSchema.default;
    }
    const entityDefinition = this.definition as IStratosEntityDefinition;
    // Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
    const tempId = EntityCatalogHelpers.buildEntityKey(schemaKey, entityDefinition.endpoint.type);
    if (!catalogSchema[schemaKey] && tempId === this.entityKey) {
      // We've requested the default by passing the schema key that matches the entity type
      return catalogSchema.default;
    }
    return catalogSchema[schemaKey];
  }

  public getGuidFromEntity(entity: Y) {
    if (!this.builders.entityBuilder || !this.builders.entityBuilder.getGuid || !this.builders.entityBuilder.getMetadata) {
      return null;
    }
    const metadata = this.builders.entityBuilder.getMetadata(entity);
    return this.builders.entityBuilder.getGuid(metadata);
  }

  public getEndpointGuidFromEntity(entity: Y & EntityPipelineEntity) {
    return entity[stratosEndpointGuidKey];
  }

  public getTypeAndSubtype() {
    const type = this.definition.parentType || this.definition.type;
    const subType = this.definition.parentType ? this.definition.type : null;
    return {
      type,
      subType
    };
  }
  // Backward compatibility with the old actions.
  // This should be removed after everything is based on the new flow
  private getLegacyTypeFromAction(
    action: EntityRequestAction,
    actionString: 'start' | 'success' | 'failure' | 'complete'
  ) {
    if (action && action.actions) {
      switch (actionString) {
        case 'success':
          return action.actions[1];
        case 'failure':
          return action.actions[2];
        case 'start':
          return action.actions[0];
      }
    }
    return null;
  }

  private getTypeFromAction(action?: EntityRequestAction) {
    if (action) {
      const actionBuilderAction = action as ActionBuilderAction;
      return actionBuilderAction.actionBuilderActionType || null;
    }
    return null;
  }

  public getRequestType(
    actionString: 'start' | 'success' | 'failure' | 'complete',
    actionOrActionBuilderKey?: EntityRequestAction | string,
    requestType: string = 'request'
  ) {
    const requestTypeLabel = typeof actionOrActionBuilderKey === 'string' ?
      actionOrActionBuilderKey :
      this.getTypeFromAction(actionOrActionBuilderKey) || requestType;
    return `@stratos/${this.entityKey}/${requestTypeLabel}/${actionString}`;
  }

  public getRequestAction(
    actionString: 'start' | 'success' | 'failure' | 'complete',
    actionOrActionBuilderKey?: EntityRequestAction | string,
    requestType?: string,
    response?: any
  ): APISuccessOrFailedAction {
    if (typeof actionOrActionBuilderKey === 'string') {
      return new APISuccessOrFailedAction(this.getRequestType(actionString, actionOrActionBuilderKey), null, response);
    }
    const type =
      this.getLegacyTypeFromAction(actionOrActionBuilderKey, actionString) ||
      this.getRequestType(actionString, actionOrActionBuilderKey, requestType);
    return new APISuccessOrFailedAction(type, actionOrActionBuilderKey, response);

  }

  public getPaginationConfig(): PaginationPageIteratorConfig {
    return this.definition.paginationConfig ?
      this.definition.paginationConfig :
      null;
  }
}

export class StratosCatalogEntity<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders,
  AA extends EntityApiCustom = EntityApiCustom,
  > extends StratosBaseCatalogEntity<T, Y, AB, ABC, AA> {
  public definition: IStratosEntityDefinition<EntityCatalogSchemas, Y, ABC>;
  constructor(
    entity: IStratosEntityDefinition,
    config?: EntityCatalogBuilders<T, Y, AB, AA>
  ) {
    super(entity, config);
  }

  public getPaginationConfig(): PaginationPageIteratorConfig {
    return this.definition.paginationConfig ?
      this.definition.paginationConfig :
      this.definition.endpoint ? this.definition.endpoint.paginationConfig : null;
  }
}

export class StratosCatalogEndpointEntity extends StratosBaseCatalogEntity<IEndpointFavMetadata, EndpointModel> {
  static readonly baseEndpointRender = {
    getMetadata: endpoint => ({
      name: endpoint.name,
      guid: endpoint.guid,
      address: getFullEndpointApiUrl(endpoint),
      user: endpoint.user ? endpoint.user.name : undefined,
      subType: endpoint.sub_type,
      admin: endpoint.user ? endpoint.user.admin ? 'Yes' : 'No' : undefined
    }),
    getLink: () => null,
    getGuid: metadata => metadata.guid,
    getLines: () => [
      ['Address', (metadata) => metadata.address],
      ['User', (metadata) => metadata.user],
      ['Admin', (metadata) => metadata.admin]
    ]
  } as IStratosEntityBuilder<IEndpointFavMetadata, EndpointModel>;
  // This is needed here for typing
  public definition: IStratosEndpointDefinition<EntityCatalogSchemas>;
  constructor(
    entity: StratosEndpointExtensionDefinition | IStratosEndpointDefinition,
    getLink?: (metadata: IEndpointFavMetadata) => string
  ) {
    const fullEntity = {
      ...entity,
      schema: {
        default: endpointEntitySchema
      }
    } as IStratosEndpointDefinition;
    super(fullEntity, {
      entityBuilder: {
        ...StratosCatalogEndpointEntity.baseEndpointRender,
        getLink: getLink || StratosCatalogEndpointEntity.baseEndpointRender.getLink
      }
    });
  }
}


// type EntityApi3<Y, ABC extends OrchestratedActionBuilders> = {
//   getEntityMonitor: (
//     helper: EntityCatalogHelper,
//     entityId: string,
//     params?: {
//       schemaKey?: string,
//       startWithNull?: boolean
//     }
//   ) => EntityMonitor<Y>;
//   getEntityService: (
//     helper: EntityCatalogHelper,
//     ...args: Parameters<ABC['get']>
//   ) => EntityService<Y>;

//   getPaginationMonitor: (
//     helper: EntityCatalogHelper,
//     ...args: Parameters<ABC['getMultiple']>
//   ) => PaginationMonitor<Y>;
//   getPaginationService: (
//     helper: EntityCatalogHelper,
//     ...args: Parameters<ABC['getMultiple']>
//   ) => PaginationObservables<Y>;
//   [K in keyof ABC]: (
//     ...args: Parameters<ABC[K]>
//   ) => Observable<ActionState>
// };

// export type EntityStorage<Y, ABC extends OrchestratedActionBuilders> = {
//   [K in keyof ABC]: (
//     ...args: Parameters<ABC[K]>
//   ) => EntityAccessEntity<Y> | EntityAccessPagination<Y>
// };


// export interface EntityApi2<Y, ABC extends OrchestratedActionBuilders> {
//   actions: {
//     [K in keyof ABC]: (
//       ...args: Parameters<ABC[K]>
//     ) => Action
//   };
//   api: {
//     [K in keyof ABC]: (
//       ...args: Parameters<ABC[K]>
//     ) => Observable<ActionState>
//   };
//   fetchTBD: {
//     [K in keyof ABC]: (
//       ...args: Parameters<ABC[K]>
//     ) => EntityAccessEntity<Y> | EntityAccessPagination<Y>
//   };
// }
// cfEntityCatalog.appEnvVar.api.action.dispatch.removeFromApplication
// cfEntityCatalog.appEnvVar.api.store.custom.getFromMultipleApps

// getEntityMonitor: (
//   helper: EntityCatalogHelper,
//   entityId: string,
//   params?: {
//     schemaKey?: string,
//     startWithNull?: boolean
//   }
// ) => EntityMonitor<Y>;
// getEntityService: (
//   helper: EntityCatalogHelper,
//   ...args: Parameters<ABC['get']>
// ) => EntityService<Y>;
// getPaginationMonitor: (
//   helper: EntityCatalogHelper,
//   ...args: Parameters<ABC['getMultiple']>
// ) => PaginationMonitor<Y>;
// getPaginationService: (
//   helper: EntityCatalogHelper,
//   ...args: Parameters<ABC['getMultiple']>
// ) => PaginationObservables<Y>;

// ------------ end 1
