import {
  QuotaFormValues,
} from '../../../core/src/features/cloud-foundry/quota-definition-form/quota-definition-form.component';
import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { CreateQuotaDefinition, GetQuotaDefinitions, UpdateQuotaDefinition } from '../actions/quota-definitions.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface QuotaDefinitionActionBuilder extends OrchestratedActionBuilders {
  create: (
    id: string,
    endpointGuid: string,
    createQuota: QuotaFormValues
  ) => CreateQuotaDefinition;
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota: QuotaFormValues
  ) => UpdateQuotaDefinition;
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetQuotaDefinitions;
}

export const quotaDefinitionActionBuilder: QuotaDefinitionActionBuilder = {
  create: (
    id: string,
    endpointGuid: string,
    createQuota: QuotaFormValues
  ) => new CreateQuotaDefinition(id, endpointGuid, createQuota),
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota: QuotaFormValues
  ) => new UpdateQuotaDefinition(guid, endpointGuid, updateQuota),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetQuotaDefinitions(paginationKey, endpointGuid, includeRelations, populateMissing),
};

