import { Observable } from 'rxjs';

import {
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { StratosCatalogEntity } from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IEntityMetadata, IStratosEntityDefinition } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { UserFavorite } from '../../../../store/src/types/user-favorites.types';
import { KubernetesPodExpandedStatus } from '../services/kubernetes-expanded-state';

// Map of endpoint ID to current namespace for that endpoint
export interface KubernetesCurrentNamespace {
  [endpoint: string]: string;
}

export interface KubernetesInfo {
  nodes: {};
  pods: {};
}

export const KubernetesDefaultState = {
  pods: {},
  namespaces: {},
  nodes: {}
};

export interface BasicKubeAPIResource {
  metadata: Metadata;
  status: any;
  spec: any;
}

export interface KubeAPIResource extends BasicKubeAPIResource {
  metadata: Metadata;
  status: BaseStatus;
  spec: any;
}

export interface IKubeResourceEntityDefinition extends IStratosEntityDefinition {
  apiVersion: string;
  apiName: string;
  apiNamespaced: boolean;
}

export interface KubeResourceEntityDefinition<
  A extends IEntityMetadata = IEntityMetadata,
  B = any,
  C extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders
  > {
  apiVersion: string;
  apiName: string;
  apiNamespaced?: boolean;
  apiWorkspaced?: boolean;
  label: string;
  labelPlural?: string;
  labelTab?: string;
  icon: string;
  iconFont?: string;
  type: string;
  getKubeCatalogEntity?: (IStratosEntityDefinition) => StratosCatalogEntity<A, B, C>;
  getIsValid?: (fav: UserFavorite<A>) => Observable<boolean>;
  listColumns?: SimpleKubeListColumn[];
  // Should this entity be hidden in the auto-generated navigation?
  hidden?: boolean;
  // Name fo a list config that can be obtained from the list config service
  listConfig?: string;
  // Allow this entity to be favorited?
  canFavorite?: boolean;
}

export interface KubeService extends BasicKubeAPIResource {
  metadata: KubeServiceMetadata;
  status: ServiceStatus;
  spec: DeploymentSpec;
}

export interface KubernetesStatefulSet extends BasicKubeAPIResource {
  metadata: KubeServiceMetadata;
  status: ServiceStatus;
  spec: ServiceSpec;
}

export interface DeploymentSpec {
  replicas: number;
  selector?: any;
  template?: any;
  strategy?: any;
  revisionHistoryLimit: number;
  progressDeadlineSeconds: number;
  type?: string;
  clusterIP?: string;
}

export interface KubernetesDeployment extends BasicKubeAPIResource {
  metadata: KubeServiceMetadata;
  status: ServiceStatus;
  spec: ServiceSpec;
}

export interface ServiceStatus {
  loadBalancer: LoadBalancerStatus;
}

export interface LoadBalancerStatus {
  ingress: LoadBalancerIngress[];
}

export interface LoadBalancerIngress {
  hostname: string;
  ip: string;
}
export interface ServiceSpec {
  ports: Port[];
  clusterIP: string;
  type: string;
  sessionAffinity: string;
  sessionAffinityConfig: GenericMap;
  selector: GenericMap;
  externalTrafficPolicy: string;
}

export interface GenericMap {
  [key: string]: string;
}


export interface KubernetesNode extends BasicKubeAPIResource {
  metadata: Metadata;
  status: NodeStatus;
  spec: PodSpec;
}

export interface KubernetesApp {
  kubeId: string;
  name: string;
  pods: KubernetesPod[];
  namespace?: string;
  createdAt: Date;
  status: string;
  version: string;
  chartName: string;
  appVersion: string;
}
export interface NodeStatus {
  capacity?: Capacity;
  allocatable?: Allocatable;
  conditions: KubernetesCondition[];
  addresses: KubernetesAddress[];
  daemonEndpoints?: DaemonEndpoints;
  nodeInfo?: NodeInfo;
  images: Image[];
}


export interface Taint {
  key: string;
  effect: string;
}

export interface Spec {
  podCIDR: string;
  externalID: string;
  taints: Taint[];
}

export interface Capacity {
  cpu: string;
  memory: string;
  pods: string;
}

export interface Allocatable {
  cpu: string;
  memory: string;
  pods: string;
}

export enum ConditionType {
  OutOfDisk = 'OutOfDisk',
  MemoryPressure = 'MemoryPressure',
  DiskPressure = 'DiskPressure',
  Ready = 'Ready',
  PIDPressure = 'PIDPressure',
  NetworkUnavailable = 'NetworkUnavailable',
  CaaspUpdates = 'CaaspUpdates',
  CaaspDisruptive = 'CaaspDisruptive',
  CaaspSecurity = 'CaaspSecurity'
}
export const ConditionTypeLabels = {
  [ConditionType.Ready]: 'Ready',
  [ConditionType.OutOfDisk]: 'Out of Disk',
  [ConditionType.MemoryPressure]: 'Memory Pressure',
  [ConditionType.DiskPressure]: 'Disk Pressure',
  [ConditionType.PIDPressure]: 'PID Pressure',
  [ConditionType.NetworkUnavailable]: 'Network Unavailable',
  [ConditionType.CaaspUpdates]: 'Updates Available',
  [ConditionType.CaaspDisruptive]: 'Disruptive Update',
  [ConditionType.CaaspSecurity]: 'Security Update'
};

export enum ConditionStatus {
  False = 'False',
  True = 'True',
  Unknown = 'Unknown'
}

export interface KubernetesCondition {
  type: ConditionType;
  status: ConditionStatus;
  lastHeartbeatTime: Date;
  lastTransitionTime: Date;
  reason: string;
  message: string;
}

export interface KubernetesAddress {
  type: string;
  address: string;
}

export const KubernetesAddressInternal = 'InternalIP';
export const KubernetesAddressExternal = 'ExternalIP';

export interface KubeletEndpoint {
  Port: number;
}

export interface DaemonEndpoints {
  kubeletEndpoint: KubeletEndpoint;
}

export interface NodeInfo {
  machineID: string;
  systemUUID: string;
  bootID: string;
  kernelVersion: string;
  osImage: string;
  containerRuntimeVersion: string;
  kubeletVersion: string;
  kubeProxyVersion: string;
  operatingSystem: string;
  architecture: string;
}

export interface Image {
  names: string[];
  sizeBytes: number;
}


export interface KubernetesPod extends BasicKubeAPIResource {
  metadata: Metadata;
  status: PodStatus;
  spec: PodSpec;
  deletionTimestamp?: any;
  expandedStatus: KubernetesPodExpandedStatus;
}

export enum KubernetesStatus {
  ACTIVE = 'Active',
  RUNNING = 'Running',
  FAILED = 'Failed',
  PENDING = 'Pending'
}
export interface KubernetesNamespace extends BasicKubeAPIResource {
  metadata: Metadata;
  spec: {
    finalizers: string[];
  };
  status: BaseStatus;
}

export interface BaseStatus {
  phase: KubernetesStatus;
}

export interface PodStatus {
  phase: KubernetesStatus;
  conditions?: KubernetesCondition[];
  message?: string;
  reason?: string;
  hostIP?: string;
  podIP?: string;
  podIPs?: {
    ip: string;
  }[];
  startTime?: Date;
  containerStatuses?: ContainerStatus[];
  qosClass?: string;
  initContainerStatuses?: ContainerStatus[];
  nominatedNodeName: string;
}
export interface KubernetesCondition {
  type: ConditionType;
  status: ConditionStatus;
  lastProbeTime?: any;
  lastTransitionTime: Date;
}

export interface ContainerStatus {
  name: string;
  state: ContainerStateCollection;
  lastState: ContainerStateCollection;
  ready: boolean;
  restartCount: number;
  image: string;
  imageID: string;
  containerID: string;
}

export interface ContainerStateCollection {
  [key: string]: ContainerState;
}

export interface ContainerState {
  startedAt: Date;
  reason: string;
  signal: number;
  exitCode: number;
}

export interface PodSpec {
  volumes?: Volume[];
  containers: Container[];
  restartPolicy?: string;
  terminationGracePeriodSeconds?: number;
  dnsPolicy?: string;
  serviceAccountName?: string;
  serviceAccount?: string;
  nodeName: string;
  securityContext?: SecurityContext;
  affinity?: Affinity;
  schedulerName: string;
  tolerations?: Toleration[];
  hostNetwork?: boolean;
  initContainers: InitContainer[];
  // nodeSelector?: NodeSelector;
  readinessGates: any[];
}

export interface InitContainer {
  name: string;
  image: string;
  command: string[];
  resources: Resources;
  volumeMounts: VolumeMount[];
  terminationMessagePath: string;
  terminationMessagePolicy: string;
  imagePullPolicy: string;
  securityContext: SecurityContext;
}

export interface KubernetesConfigMap {
  data: {
    apiVersion: string,
    binaryData: {
      [key: string]: any,
    },
    data: {
      [key: string]: any,
    },
    kind: string;
  };
  metadata: KubeServiceMetadata;
}
export interface Resources {
  limits?: Limits;
  requests?: Requests;
}

export interface Limits {
  memory: string;
}

export interface Requests {
  memory: string;
  cpu: string;
}
export enum MetricStatistic {
  AVERAGE = 'avg',
  MAXIMUM = 'max',
  MINOMUM = 'min'
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly?: boolean;
}

export interface BaseMetadata {
  namespace: string;
  name: string;
  uid: string;
}

export interface Metadata extends BaseMetadata {
  resourceVersion?: string;
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  labels?: Labels;
  annotations?: Annotations;
  kubeId?: string;
  generation?: number;
}

export interface KubeServiceMetadata extends Metadata {
  selfLink: string;
}

export interface Container {
  name: string;
  image: string;
  command: string[];
  ports: Port[];
  resources: Resources;
  volumeMounts: VolumeMount[];
  livenessProbe: Probe;
  readinessProbe: Probe;
  terminationMessagePath: string;
  terminationMessagePolicy: string;
  imagePullPolicy: string;
  securityContext: SecurityContext;
  args: string[];
  env: Env[];
}

export interface Probe {
  httpGet: HttpGet;
  initialDelaySeconds: number;
  timeoutSeconds: number;
  periodSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}
export interface Env {
  name: string;
  value: string;
  valueFrom?: any;
}

export interface HttpGet {
  path: string;
  port: any;
  scheme: string;
}

export interface Port {
  name: string;
  containerPort: number;
  protocol: string;
  hostPort?: number;
}

export interface MatchExpression {
  key: string;
  operator: string;
  values: string[];
}

export interface LabelSelector {
  matchExpressions: MatchExpression[];
}

export interface SecurityContext {
  allowPrivilegeEscalation?: boolean;
  privileged?: boolean;
}


export interface PodAffinityTerm {
  labelSelector: LabelSelector;
  topologyKey: string;
}

export interface PreferredDuringSchedulingIgnoredDuringExecution {
  weight: number;
  podAffinityTerm: PodAffinityTerm;
}

export interface PodAntiAffinity {
  preferredDuringSchedulingIgnoredDuringExecution: PreferredDuringSchedulingIgnoredDuringExecution[];
}

export interface Affinity {
  podAntiAffinity: PodAntiAffinity;
}

export interface Toleration {
  key: string;
  operator: string;
  effect: string;
  tolerationSeconds?: number;
}

export interface Labels {
  [key: string]: string;
}

export interface PodLabel {
  key: string;
  value: string;
}

export interface Annotations {
  [key: string]: string;
}
export interface OwnerReference {
  [key: string]: string;
}

export interface Volume {
  name: string;
  configMap: ConfigMap;
  secret: Secret;
  hostPath: HostPath;
}


export interface ConfigMap<T = Item> {
  name: string;
  items: T[];
  defaultMode: number;
}

export interface Secret {
  secretName: string;
  defaultMode: number;
}

export interface HostPath {
  path: string;
  type: string;
}
export interface Item {
  key: string;
}

export interface KubeStatus {
  kind: string;
  apiVersion: string;
  metadata: Metadata;
  status: string;
  message: string;
  reason: string;
  details: {};
  code: number;
}

// Analysis Reports

export interface AnalysisReport {
  id: string;
  endpoint: string;
  type: string;
  name: string;
  path: string;
  created: Date;
  read: boolean;
  status: string;
  duration: number;
  report?: any;
  title?: string;
}


export interface KubernetesConfigMap extends BasicKubeAPIResource {
  test?: string;
}

export type SimpleColumnValueGetter<T> = (row: T) => string | Observable<string>;

export interface SimpleKubeListColumn<T = any> {
  field: string | SimpleColumnValueGetter<T>;
  header: string;
  flex?: string;
  sort?: boolean;
}

export interface KubeServiceAccount {
  metadata: Metadata;
  secrets: { [name: string]: string; }[];
}
