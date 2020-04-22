import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from '../../core/src/core/cf-api-svc.types';
import {
  IApp,
  IAppSummary,
  IBuildpack,
  ICfV2Info,
  IDomain,
  IFeatureFlag,
  IOrganization,
  IOrgQuotaDefinition,
  IPrivateDomain,
  IRoute,
  ISecurityGroup,
  ISpace,
  ISpaceQuotaDefinition,
  IStack,
} from '../../core/src/core/cf-api.types';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
} from '../../store/src/entity-catalog/entity-catalog-entity';
import { APIResource } from '../../store/src/types/api.types';
import { IAppFavMetadata, IBasicCFMetaData, IOrgFavMetadata, ISpaceFavMetadata } from './cf-metadata-types';
import { AppEnvVarActionBuilders, AppEnvVarApiCustom } from './entity-action-builders/application-env-var.action-builders';
import { AppStatsActionBuilders } from './entity-action-builders/application-stats.action-builders';
import { AppSummaryActionBuilders } from './entity-action-builders/application-summary.action-builders';
import { BuildpackActionBuilders } from './entity-action-builders/buildpack.action-builders';
import { CfInfoDefinitionActionBuilders } from './entity-action-builders/cf-info.action-builders';
import { GitCommitActionBuilders, GitCommitActionBuildersConfig } from './entity-action-builders/git-action-builder';
import { QuotaDefinitionActionBuilder } from './entity-action-builders/quota-definition.action-builders';
import { SecurityGroupBuilders } from './entity-action-builders/security-groups.action-builder';
import {
  ServiceBindingActionBuilders,
  ServiceBindingApiCustom,
} from './entity-action-builders/service-binding.action-builders';
import { ServiceBrokerActionBuilders } from './entity-action-builders/service-broker.entity-builders';
import { ServicePlanVisibilityActionBuilders } from './entity-action-builders/service-plan-visibility.action-builders';
import { ServiceActionApiCustom, ServiceActionBuilders } from './entity-action-builders/service.entity-builders';
import { SpaceQuotaDefinitionActionBuilders } from './entity-action-builders/space-quota.action-builders';
import {
  UserProvidedServiceActionBuilder,
  UserProvidedServiceApiCustom,
} from './entity-action-builders/user-provided-service.action-builders';
import { AppStat } from './store/types/app-metadata.types';
import { GitBranch, GitCommit, GitRepo } from './store/types/git.types';
import { CfUser } from './store/types/user.types';

export class CfEntityCatalog {
  // public entities: StratosBaseCatalogEntity[];

  public cfEndpoint: StratosCatalogEndpointEntity;

  public quotaDefinition: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IOrgQuotaDefinition>,
    QuotaDefinitionActionBuilder
  >;

  public appEnvVar: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource,
    AppEnvVarActionBuilders,
    AppEnvVarActionBuilders,
    AppEnvVarApiCustom
  >;

  public appSummary: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    IAppSummary,
    AppSummaryActionBuilders
  >;

  public spaceQuota: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<ISpaceQuotaDefinition>,
    SpaceQuotaDefinitionActionBuilders
  >;

  public privateDomain: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IPrivateDomain>
  >;

  public cfInfo: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<ICfV2Info>,
    CfInfoDefinitionActionBuilders
  >;

  public appStats: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    AppStat,
    AppStatsActionBuilders
  >;

  public buildPack: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IBuildpack>,
    BuildpackActionBuilders
  >;

  public serviceBroker: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServiceBroker>,
    ServiceBrokerActionBuilders
  >;

  public servicePlanVisibility: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServicePlanVisibility>,
    ServicePlanVisibilityActionBuilders
  >;

  public securityGroup: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<ISecurityGroup>,
    SecurityGroupBuilders
  >;

  public serviceBinding: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServiceBinding>,
    ServiceBindingActionBuilders,
    ServiceBindingActionBuilders,
    ServiceBindingApiCustom
  >;

  public service: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IService>,
    ServiceActionBuilders,
    ServiceActionBuilders,
    ServiceActionApiCustom
  >;

  public servicePlan: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServicePlan>
  //  servicePlanActionBuilders,
  >;

  public serviceInstance: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServiceInstance>
  //   serviceInstanceActionBuilders,
  >;

  public user: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<CfUser>
  //    userActionBuilders,
  >;

  public domain: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IDomain>
  //  domainActionBuilders,
  >;

  public gitCommit: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    GitCommit,
    GitCommitActionBuildersConfig,
    GitCommitActionBuilders
  >;

  public gitRepo: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<GitRepo> // TODO: RC is this correct???
  //  gitRepoActionBuilders,
  >;

  public gitBranch: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<GitBranch> // TODO: RC is this correct???
  //  gitBranchActionBuilders,
  >;

  public event: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource // TODO: RC
  //  cfEventActionBuilders,
  >;


  public route: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IRoute>
  //  routesActionBuilders,
  >;

  public stack: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IStack>
  //  stackActionBuilders,
  >;

  public featureFlag: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    IFeatureFlag
  // featureFlagActionBuilders,
  >;

  public application: StratosBaseCatalogEntity<
    IAppFavMetadata,
    APIResource<IApp>
  //   applicationActionBuilder,
  >;

  public space: StratosBaseCatalogEntity<
    ISpaceFavMetadata,
    APIResource<ISpace>
  //    spaceActionBuilders
  >;

  public org: StratosBaseCatalogEntity<
    IOrgFavMetadata,
    APIResource<IOrganization>
  //  organizationActionBuilders
  >;

  public metric: StratosBaseCatalogEntity<
    IBasicCFMetaData
  >;


  public userProvidedServiceEntity: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceApiCustom
  >;
  // public userProvidedServiceEntityApi: EntityApiProxy<APIResource<IUserProvidedServiceInstance>, UserProvidedServiceActionBuilder, UserProvidedServiceAccessBuilders>;
}

// export const cfEntityCatalog = () => new CfEntityCatalog();
export const cfEntityCatalog: CfEntityCatalog = new CfEntityCatalog();
