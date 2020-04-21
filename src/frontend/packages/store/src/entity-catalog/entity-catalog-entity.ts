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
import { getPaginationObservables, PaginationObservables } from '../reducers/pagination-reducer/pagination-reducer.helper';
import { EndpointModel } from '../types/endpoint.types';
import { PaginatedAction } from '../types/pagination.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../types/request.types';
import { IEndpointFavMetadata } from '../types/user-favorites.types';
import { ActionBuilderConfigMapper } from './action-builder-config.mapper';
import { EntityActionDispatcherManager } from './action-dispatcher/action-dispatcher';
import {
  ActionBuilderAction,
  ActionOrchestrator,
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
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


// interface RActions<Y, V extends OrchestratedActionBuilders> {
//   entity: {

//   };
//   entities: {
//     monitor: {
//       [P in V]: PaginationMonitor<Y>;
//     },
//     observables: {
//       [P in V]: PaginationObservables<Y>;
//     }
//   };
// }

// type test = <B extends keyof ABC, ABC>(...args: Parameters<ABC[B]>) => void;
// type Test = <ABC, D, B extends keyof ABC>(...args: Parameters<ABC[B]>) => D;
// type GenericIdentityFn = <T>(arg: T) => T;
// type Test2<ABC, B extends keyof ABC> = {
//   [P in B]: OrchestratedActionBuilders;
// };
// interface Test3<ABC extends {}> {
//   [B in ABC]: OrchestratedActionBuilders;
// }

export interface GahEntityAccess<Y> {
  entityMonitor: EntityMonitor<Y>;
  entityService: EntityService<Y>;
}

export interface GahEntitiesAccess<Y> {
  monitor: PaginationMonitor<Y>;
  obs: PaginationObservables<Y>;
}

export interface GahActionBuilders<Y, ABC extends OrchestratedActionBuilders> {
  getEntityMonitor: (
    helper: EntityCatalogHelper,
    entityId: string,
    params: {
      schemaKey: string,
      startWithNull: false
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
  getPaginationObservables: (
    helper: EntityCatalogHelper,
    ...args: Parameters<ABC['getMultiple']>
  ) => PaginationObservables<Y>;
  [others: string]: (
    helper: EntityCatalogHelper,
    ...args
  ) => any; // TODO: RC bad.. catches all...
  // Update, etc?
}

type GAH<Y, ABC extends OrchestratedActionBuilders, AA extends GahActionBuilders<Y, ABC>> = {
  [K in keyof AA]: (...args: Parameters<AA[K]>) => any;
};


// type GAH<AA extends GahActionBuilders<Y>, Y> = {
//   [K in keyof AA]: (...args: Parameters<AA[K]>) => any;
// };



export interface EntityCatalogBuilders<
  T extends IEntityMetadata = IEntityMetadata,
  Y = any,
  AB extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders,
  ABC extends OrchestratedActionBuilders = AB extends OrchestratedActionBuilders ? AB : OrchestratedActionBuilders,
  AA extends GahActionBuilders<Y, ABC> = GahActionBuilders<Y, ABC>, // access builders
  > {
  entityBuilder?: IStratosEntityBuilder<T, Y>;
  // Allows extensions to modify entities data in the store via none API Effect or unrelated actions.
  dataReducers?: ActionReducer<IRequestEntityTypeState<Y>>[];
  actionBuilders?: AB;
  entityAccess?: Partial<AA>;
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
  AA extends GahActionBuilders<Y, ABC> = GahActionBuilders<Y, ABC>, // access builders
  > {
  // implements ABCD
  constructor(
    definition: IStratosEntityDefinition | IStratosEndpointDefinition | IStratosBaseEntityDefinition,
    public readonly builders: EntityCatalogBuilders<T, Y, AB, ABC, AA> = {}
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
    this.actionOrchestrator = new ActionOrchestrator<ABC>(this.entityKey, actionBuilders as ABC);
    this.actionDispatchManager = this.actionOrchestrator.getEntityActionDispatcher();
    this.entityAccess = {
      ...this.createEntityAccess(),
      ...this.builders.entityAccess // TODO: RC change to partial
    };
  }


  // [TYF in ABC] => (type: B) => {}
  // test2: Test2<ABC, '', ''>;
  actionBuilders: ABC;
  // gah: GAH<ABC>;
  entityAccess: GAH<Y, ABC, AA>;

  // abcType = ABC;

  public readonly entityKey: string;
  public readonly type: string;
  public readonly definition: DefinitionTypes;
  public readonly isEndpoint: boolean;
  public readonly actionDispatchManager: EntityActionDispatcherManager<ABC>;
  public readonly actionOrchestrator: ActionOrchestrator<ABC>;
  public readonly endpointType: string;

  private createEntityAccess(): GAH<Y, ABC, AA> {
    const res: GahActionBuilders<Y, ABC> = {
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
        ...args: Parameters<ABC['get']> // TODO: RC into interface
      ): EntityService<Y> => {
        const action = this.actionOrchestrator.getActionBuilder('get')(...args);
        return helper.esf.create<Y>(
          action.guid,
          action
        );
      },
      getPaginationMonitor: (
        helper: EntityCatalogHelper,
        ...args: Parameters<ABC['getMultiple']>
      ): PaginationMonitor<Y> => {
        const action = this.actionOrchestrator.getActionBuilder('getMultiple')(...args);
        return helper.pmf.create<Y>(
          action.paginationKey,
          action,
          action.flattenPagination
        );
      },
      getPaginationObservables: (
        helper: EntityCatalogHelper,
        ...args: Parameters<ABC['getMultiple']>
      ): PaginationObservables<Y> => {
        const action = this.actionOrchestrator.getActionBuilder('getMultiple')(...args);
        return getPaginationObservables<Y>({
          store: helper.store,
          action,
          paginationMonitor: helper.pmf.create<Y>(
            action.paginationKey,
            action,
            action.flattenPagination
          ) // TODO: RC
        }, action.flattenPagination);
      },
    };
    const res2: GAH<Y, ABC, AA> = res as GAH<Y, ABC, AA>;
    return res2;
  }

  // [R in ABC]: () => null;
  // [R in keyof ABC]: () => null;
  // sdfsdf: Record<'sdf', OrchestratedActionBuilders>;
  // sdfsdf: Record<'sdf', OrchestratedActionBuilders>;
  // sdfsdf2: <B extends keyof ABC, OrchestratedActionBuilders> = {
  //   [P in K]: T;
  // };

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

  public getEntityMonitor(
    helper: EntityCatalogHelper,
    entityId: string,
    {
      schemaKey = '',
      startWithNull = false
    } = {}
  ): EntityMonitor<Y> {
    return new EntityMonitor<Y>(helper.store, entityId, this.entityKey, this.getSchema(schemaKey), startWithNull);
  }

  public getEntityService<YY = Y>(
    helper: EntityCatalogHelper,
    ...args: Parameters<ABC['get']> // TODO: RC Confirm this is always the case!
  ): EntityService<YY> {
    const action: EntityRequestAction = this.createAction<'get'>('get', ...args) as EntityRequestAction;
    return helper.esf.create<YY>(
      action.guid,
      action
    );
  }

  public getEntityServiceByAction<YY = Y>(
    helper: EntityCatalogHelper,
    action: EntityRequestAction
  ): EntityService<YY> {
    return helper.esf.create<YY>(
      action.guid,
      action
    );
  }

  // this[B] = (args: ABC[B]) =>
  public getPaginationMonitor<B extends keyof ABC, YY = Y>(
    helper: EntityCatalogHelper,
    actionType: B, // 'getAll/getAllInSpace' etc
    ...args: Parameters<ABC[B]>
  ): PaginationMonitor<YY> {
    const action: PaginatedAction = this.createAction<B>(actionType, ...args) as PaginatedAction;
    return helper.pmf.create<YY>(
      action.paginationKey,
      action,
      action.flattenPagination
    );
  }

  public getPaginationMonitorByAction<YY = Y>(
    helper: EntityCatalogHelper,
    action: PaginatedAction
  ): PaginationMonitor<YY> {
    return helper.pmf.create<YY>(
      action.paginationKey,
      action,
      action.flattenPagination
    );
  }

  public getPaginationObservables<B extends keyof ABC, YY = Y>(
    helper: EntityCatalogHelper,
    actionType: B, // 'getAll/getAllInSpace' etc
    ...args: Parameters<ABC[B]>
  ): PaginationObservables<YY> {
    const action: PaginatedAction = this.createAction<B>(actionType, ...args) as PaginatedAction;

    return getPaginationObservables<YY>({
      store: helper.store,
      action,
      paginationMonitor: this.getPaginationMonitor(
        helper,
        actionType,
        ...args
      )
    }, action.flattenPagination); // TODO: RC This isn't always the case. Can it be ommited?
  }

  public getPaginationObservablesByAction<YY = Y>(
    helper: EntityCatalogHelper,
    action: PaginatedAction
  ): PaginationObservables<YY> {
    return getPaginationObservables<YY>({
      store: helper.store,
      action,
      paginationMonitor: this.getPaginationMonitorByAction(
        helper,
        action
      )
    }, action.flattenPagination); // TODO: RC This isn't always the case. Can it be ommited?
  }

  public createAction<B extends keyof ABC>(
    actionType: B,
    ...args: Parameters<ABC[B]>
  ): Action {
    const actionBuilder = this.actionOrchestrator.getActionBuilder(actionType);
    return actionBuilder(...args);
  }


  getProperty<K extends keyof ABC>(key: K): ABC[K] {
    return this.actionBuilders[key];
  }
  // getPropertyOrig<T, K extends keyof T>(obj: T, key: K): T[K] {
  //   return obj[key];
  // }

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
  AA extends GahActionBuilders<Y, ABC> = GahActionBuilders<Y, ABC>,
  > extends StratosBaseCatalogEntity<T, Y, AB, ABC, AA> {
  public definition: IStratosEntityDefinition<EntityCatalogSchemas, Y, ABC>;
  constructor(
    entity: IStratosEntityDefinition,
    config?: EntityCatalogBuilders<T, Y, AB, ABC, AA>
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


// const a = {
//   getEntity: (
//     helper: EntityCatalogHelper,
//     ...args: Parameters<ABC['get']>
//   ): GahEntityAccess<Y> => {
//     const action = this.actionOrchestrator.getActionBuilder('get')(...args);
//     return {
//       // tslint:disable-next-line:max-line-length
//       entityMonitor: new EntityMonitor<Y>(helper.store, guid, this.entityKey, this.getSchema(schemaKey), startWithNull),
//       entityService: helper.esf.create<Y>(
//         action.guid,
//         action
//       )
//     };
//   },
//   getEntities: (
//     helper: EntityCatalogHelper,
//     ...args: Parameters<ABC['getMultiple']>
//   ): GahEntitiesAccess<Y> => {
//     const action = this.actionBuilders.getMultiple(...args);
//     const mon = helper.pmf.create<Y>(
//       action.paginationKey,
//       action,
//       action.flattenPagination
//     );
//     return {
//       monitor: mon,
//       obs: getPaginationObservables<Y>({
//         store: helper.store,
//         action,
//         paginationMonitor: mon
//       }, action.flattenPagination) // TODO: RC This isn't always the case. Can it be ommited?
//     };
//   },
// }
