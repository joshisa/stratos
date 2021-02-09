import { OrchestratedActionBuilders } from '../../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  kubernetesNamespacesEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
} from '../../kubernetes-entity-factory';
import {
  DeleteAnalysisReport,
  GetAnalysisReportById,
  GetAnalysisReports,
  GetAnalysisReportsByPath,
  RunAnalysisReport,
} from '../analysis.actions';
import { DeleteKubernetesResource, GetKubernetesResourcesInWorkload } from '../kube-resource.actions';
import { BasicKubeAPIResource } from '../kube.types';
import {
  CreateKubernetesNamespace,
  GeKubernetesDeployments,
  GetKubernetesDashboard,
  GetKubernetesNamespace,
  GetKubernetesNamespaces,
  GetKubernetesNode,
  GetKubernetesNodes,
  GetKubernetesPod,
  GetKubernetesPods,
  GetKubernetesPodsInNamespace,
  GetKubernetesPodsOnNode,
  GetKubernetesServices,
  GetKubernetesServicesInNamespace,
  GetKubernetesStatefulSets,
  KubeHealthCheck,
} from '../kubernetes.actions';

export interface KubeStatefulSetsActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesStatefulSets;
}

export const kubeStatefulSetsActionBuilders: KubeStatefulSetsActionBuilders = {
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesStatefulSets(kubeGuid)
};

export interface KubePodActionBuilders extends OrchestratedActionBuilders {
  get: (
    podName: string,
    kubeGuid: string,
    extraArgs: { namespace: string, }
  ) => GetKubernetesPod;
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesPods;
  getOnNode: (
    kubeGuid: string,
    nodeName: string
  ) => GetKubernetesPodsOnNode;
  getInNamespace: (
    kubeGuid: string,
    namespace: string
  ) => GetKubernetesPodsInNamespace;
  getInWorkload: (
    kubeGuid: string,
    namespace: string,
    releaseTitle: string
  ) => GetKubernetesResourcesInWorkload;
  deleteResource: (
    resource: BasicKubeAPIResource,
    kubeGuid: string,
    resourceName: string,
    namespace?: string
  ) => DeleteKubernetesResource;
}

export const kubePodActionBuilders: KubePodActionBuilders = {
  get: (podName: string, kubeGuid: string, { namespace }) => new GetKubernetesPod(podName, namespace, kubeGuid),
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesPods(kubeGuid),
  getOnNode: (kubeGuid: string, nodeName: string) => new GetKubernetesPodsOnNode(kubeGuid, nodeName),
  getInNamespace: (kubeGuid: string, namespace: string) => new GetKubernetesPodsInNamespace(kubeGuid, namespace),
  getInWorkload: (
    kubeGuid: string,
    namespace: string,
    releaseTitle: string
  ) => new GetKubernetesResourcesInWorkload(kubernetesPodsEntityType, kubeGuid, namespace, releaseTitle),
  deleteResource: (
    resource: BasicKubeAPIResource,
    kubeGuid: string,
    resourceName: string,
    namespace?: string
  ) => new DeleteKubernetesResource(kubernetesPodsEntityType, resource, kubeGuid, resourceName, namespace)
};

export interface KubeDeploymentActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GeKubernetesDeployments;
}

export const kubeDeploymentActionBuilders: KubeDeploymentActionBuilders = {
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GeKubernetesDeployments(kubeGuid)
};

export interface KubeNodeActionBuilders extends OrchestratedActionBuilders {
  get: (
    nodeName: string,
    kubeGuid: string
  ) => GetKubernetesNode;
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesNodes;
  healthCheck: (
    kubeGuid: string,
  ) => KubeHealthCheck;
}

export const kubeNodeActionBuilders: KubeNodeActionBuilders = {
  get: (nodeName: string, endpointGuid: string) => new GetKubernetesNode(nodeName, endpointGuid),
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesNodes(kubeGuid),
  healthCheck: (kubeGuid: string) => new KubeHealthCheck(kubeGuid)
};

export interface KubeNamespaceActionBuilders extends OrchestratedActionBuilders {
  get: (
    namespace: string,
    kubeGuid: string
  ) => GetKubernetesNamespace;
  create: (
    namespace: string,
    kubeGuid: string
  ) => CreateKubernetesNamespace;
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string,
  ) => GetKubernetesNamespaces;
  deleteResource: (
    resource: BasicKubeAPIResource,
    kubeGuid: string,
    resourceName: string,
    namespace?: string
  ) => DeleteKubernetesResource;
}

export const kubeNamespaceActionBuilders: KubeNamespaceActionBuilders = {
  get: (namespace: string, kubeGuid: string) => new GetKubernetesNamespace(namespace, kubeGuid),
  create: (namespace: string, kubeGuid: string) => new CreateKubernetesNamespace(namespace, kubeGuid),
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesNamespaces(kubeGuid),
  deleteResource: (resource: BasicKubeAPIResource, kubeGuid: string, resName: string, namespace: string) =>
    new DeleteKubernetesResource(kubernetesNamespacesEntityType, resource, kubeGuid, resName, namespace)
};

export interface KubeServiceActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string,
    paginationKey?: string
  ) => GetKubernetesServices;
  getInNamespace: (
    kubeGuid: string,
    namespace: string,
  ) => GetKubernetesServicesInNamespace;
  getInWorkload: (
    kubeGuid: string,
    namespace: string,
    releaseTitle: string
  ) => GetKubernetesResourcesInWorkload;
}

export const kubeServiceActionBuilders: KubeServiceActionBuilders = {
  getMultiple: (kubeGuid: string, paginationKey?: string) => new GetKubernetesServices(kubeGuid),
  getInNamespace: (kubeGuid: string, namespace: string) => new GetKubernetesServicesInNamespace(kubeGuid, namespace),
  getInWorkload: (
    kubeGuid: string,
    namespace: string,
    releaseTitle: string
  ) => new GetKubernetesResourcesInWorkload(kubernetesServicesEntityType, kubeGuid, namespace, releaseTitle)
};

export interface KubeDashboardActionBuilders extends OrchestratedActionBuilders {
  get: (
    kubeGuid: string
  ) => GetKubernetesDashboard;
}

export const kubeDashboardActionBuilders: KubeDashboardActionBuilders = {
  get: (kubeGuid: string) => new GetKubernetesDashboard(kubeGuid)
};

export interface AnalysisReportsActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    kubeGuid: string
  ) => GetAnalysisReports;
  getById: (
    kubeGuid: string,
    id: string,
  ) => GetAnalysisReportById;
  getByPath: (
    kubeGuid: string,
    path: string,
  ) => GetAnalysisReportsByPath;
  delete: (
    kubeGuid: string,
    id: string,
  ) => DeleteAnalysisReport;
  run: (
    kubeGuid: string,
    id: string,
    namespace?: string,
    app?: string
  ) => RunAnalysisReport;
}

export const analysisReportsActionBuilders: AnalysisReportsActionBuilders = {
  getMultiple: (kubeGuid: string) => new GetAnalysisReports(kubeGuid),
  getById: (kubeGuid: string, id: string) => new GetAnalysisReportById(kubeGuid, id),
  getByPath: (kubeGuid: string, path: string) => new GetAnalysisReportsByPath(kubeGuid, path),
  delete: (kubeGuid: string, id: string) => new DeleteAnalysisReport(kubeGuid, id),
  run: (kubeGuid: string, id: string, namespace?: string, app?: string) => new RunAnalysisReport(kubeGuid, id, namespace, app)
};
