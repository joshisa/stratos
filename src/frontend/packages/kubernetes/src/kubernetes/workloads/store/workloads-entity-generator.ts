import {
  StratosBaseCatalogEntity,
  StratosCatalogEntity,
} from '../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../../../store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from '../../../../../store/src/types/user-favorites.types';
import { kubernetesEntityFactory } from '../../kubernetes-entity-factory';
import { HelmRelease, HelmReleaseGraph, HelmReleaseResources } from '../workload.types';
import { workloadsEntityCatalog } from '../workloads-entity-catalog';
import { HelmReleaseHistory } from './../workload.types';
import {
  WorkloadGraphBuilders,
  workloadGraphBuilders,
  WorkloadReleaseBuilders,
  workloadReleaseBuilders,
  WorkloadResourceBuilders,
  workloadResourceBuilders,
  WorkloadResourceHistoryBuilders,
  workloadResourceHistoryBuilders,
} from './workload-action-builders';
import {
  helmReleaseEntityKey,
  helmReleaseGraphEntityType,
  helmReleaseHistoryEntityType,
  helmReleaseResourceEntityType,
} from './workloads-entity-factory';


export function generateWorkloadsEntities(endpointDefinition: StratosEndpointExtensionDefinition): StratosBaseCatalogEntity[] {

  return [
    generateReleaseEntity(endpointDefinition),
    generateReleaseGraphEntity(endpointDefinition),
    generateReleaseResourceEntity(endpointDefinition),
    generateReleaseHistoryEntity(endpointDefinition)
  ];
}

function generateReleaseEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseEntityKey,
    schema: kubernetesEntityFactory(helmReleaseEntityKey),
    endpoint: endpointDefinition
  };
  workloadsEntityCatalog.release = new StratosCatalogEntity<IFavoriteMetadata, HelmRelease, WorkloadReleaseBuilders>(
    definition,
    {
      actionBuilders: workloadReleaseBuilders
    }
  );
  return workloadsEntityCatalog.release;
}

function generateReleaseGraphEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseGraphEntityType,
    schema: kubernetesEntityFactory(helmReleaseGraphEntityType),
    endpoint: endpointDefinition
  };
  workloadsEntityCatalog.graph = new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseGraph, WorkloadGraphBuilders>(
    definition,
    {
      actionBuilders: workloadGraphBuilders
    }
  );
  return workloadsEntityCatalog.graph;
}

function generateReleaseResourceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseResourceEntityType,
    schema: kubernetesEntityFactory(helmReleaseResourceEntityType),
    endpoint: endpointDefinition
  };
  workloadsEntityCatalog.resource = new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseResources, WorkloadResourceBuilders>(
    definition,
    {
      actionBuilders: workloadResourceBuilders
    }
  );
  return workloadsEntityCatalog.resource;
}

function generateReleaseHistoryEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmReleaseHistoryEntityType,
    schema: kubernetesEntityFactory(helmReleaseHistoryEntityType),
    endpoint: endpointDefinition
  };
  workloadsEntityCatalog.history = new StratosCatalogEntity<IFavoriteMetadata, HelmReleaseHistory, WorkloadResourceHistoryBuilders>(
    definition,
    {
      actionBuilders: workloadResourceHistoryBuilders
    }
  );
  return workloadsEntityCatalog.history;
}

