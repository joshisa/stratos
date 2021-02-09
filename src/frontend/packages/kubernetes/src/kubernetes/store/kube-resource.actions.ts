import { SortDirection } from '@angular/material/sort';

import { getPaginationKey } from '../../../../store/src/actions/pagination.actions';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { ApiRequestTypes } from '../../../../store/src/reducers/api-request-reducer/request-helpers';
import { PaginationParam } from '../../../../store/src/types/pagination.types';
import { KUBERNETES_ENDPOINT_TYPE, kubernetesEntityFactory } from '../kubernetes-entity-factory';
import { getGuidFromKubePod } from './kube.getIds';
import { BasicKubeAPIResource } from './kube.types';
import { KubePaginationAction, KubeSingleEntityAction } from './kubernetes.actions';


export const GET_KUBE_RESOURCES = '[KUBERNETES Endpoint] Get Resources';
export const GET_KUBE_RESOURCES_SUCCESS = '[KUBERNETES Endpoint] Get Resources Success';
export const GET_KUBE_RESOURCES_FAILURE = '[KUBERNETES Endpoint] Get Resources Failure';

export const GET_KUBE_RESOURCE = '[KUBERNETES Endpoint] Get Resource';
export const GET_KUBE_RESOURCE_SUCCESS = '[KUBERNETES Endpoint] Get Resource Success';
export const GET_KUBE_RESOURCE_FAILURE = '[KUBERNETES Endpoint] Get Resource Failure';

export const GET_KUBE_RESOURCES_IN_NAMESPACE = '[KUBERNETES Endpoint] Get Resources in namespace';
export const GET_KUBE_RESOURCES_IN_NAMESPACE_SUCCESS = '[KUBERNETES Endpoint] Get Resources in namespace Success';
export const GET_KUBE_RESOURCES_IN_NAMESPACE_FAILURE = '[KUBERNETES Endpoint] Get Resources in namespace Failure';

export const GET_KUBE_RESOURCES_IN_WORKLOAD = '[KUBERNETES Endpoint] Get Resources in workload';
export const GET_KUBE_RESOURCES_IN_WORKLOAD_SUCCESS = '[KUBERNETES Endpoint] Get Resources in workload Success';
export const GET_KUBE_RESOURCES_IN_WORKLOAD_FAILURE = '[KUBERNETES Endpoint] Get Resources in workload Failure';

export const DELETE_KUBE_RESOURCE = '[KUBERNETES Endpoint] Delete Resource';
export const DELETE_KUBE_RESOURCE_SUCCESS = '[KUBERNETES Endpoint] Delete Resource Success';
export const DELETE_KUBE_RESOURCE_FAILURE = '[KUBERNETES Endpoint] Delete Resource Failure';

const defaultSortParams = {
  'order-direction': 'desc' as SortDirection,
  'order-direction-field': 'name'
};

export class GetKubernetesResource implements KubeSingleEntityAction {

  public entity;

  constructor(public entityType: string, public podName: string, public namespaceName: string, public kubeGuid: string) {
    this.guid = getGuidFromKubePod(kubeGuid, namespaceName, podName);
    this.entity = [kubernetesEntityFactory(entityType)];
  }
  type = GET_KUBE_RESOURCE;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  actions = [
    GET_KUBE_RESOURCE,
    GET_KUBE_RESOURCE_SUCCESS,
    GET_KUBE_RESOURCE_FAILURE
  ];
  guid: string;
}

export class GetKubernetesResources implements KubePaginationAction {

  public entity;

  constructor(public entityType: string, public kubeGuid: string) {
    this.paginationKey = getPaginationKey(entityType, 'k8s', kubeGuid);
    this.entity = [kubernetesEntityFactory(entityType)];
  }
  type = GET_KUBE_RESOURCES;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  actions = [
    GET_KUBE_RESOURCES,
    GET_KUBE_RESOURCES_SUCCESS,
    GET_KUBE_RESOURCES_FAILURE
  ];
  paginationKey: string;
  initialParams: PaginationParam = {
    ...defaultSortParams
  };
  flattenPagination = true;
}


export class GetKubernetesResourcesInNamespace extends GetKubernetesResources {
  constructor(entityType: string, kubeGuid: string, public namespaceName: string) {
    super(entityType, kubeGuid);
    this.paginationKey = getPaginationKey(entityType, `ns-${namespaceName}`, kubeGuid);
  }
  type = GET_KUBE_RESOURCES_IN_NAMESPACE;
  actions = [
    GET_KUBE_RESOURCES_IN_NAMESPACE,
    GET_KUBE_RESOURCES_IN_NAMESPACE_SUCCESS,
    GET_KUBE_RESOURCES_IN_NAMESPACE_FAILURE
  ];
}

export class GetKubernetesResourcesInWorkload extends GetKubernetesResources {
  constructor(entityType: string, kubeGuid: string, namespace: string, releaseTitle: string) {
    super(entityType, kubeGuid);
    this.paginationKey = getPaginationKey(entityType, namespace + ':' + releaseTitle, kubeGuid);
  }
  type = GET_KUBE_RESOURCES_IN_WORKLOAD;
  actions = [
    GET_KUBE_RESOURCES_IN_WORKLOAD,
    GET_KUBE_RESOURCES_IN_WORKLOAD_SUCCESS,
    GET_KUBE_RESOURCES_IN_WORKLOAD_FAILURE
  ];
}

export class DeleteKubernetesResource implements KubeSingleEntityAction {

  public entity: EntitySchema[];

  constructor(
    public entityType: string,
    private resource: BasicKubeAPIResource,
    public kubeGuid: string,
    public name: string,
    public namespace?: string
  ) {
    const schema = kubernetesEntityFactory(this.entityType);
    this.entity = [schema];
    this.guid = schema.getId(resource);
  }

  type = DELETE_KUBE_RESOURCE;
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  actions = [
    DELETE_KUBE_RESOURCE,
    DELETE_KUBE_RESOURCE_SUCCESS,
    DELETE_KUBE_RESOURCE_FAILURE
  ];
  requestType: ApiRequestTypes = 'delete';
  guid: string;
}
