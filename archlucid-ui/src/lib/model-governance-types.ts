import type { ModelExecutionProfile } from "@/lib/model-execution-profile";

export type WorkspaceModelExecutionProfileResponse = {
  effectiveProfile: ModelExecutionProfile;
  source: "HostDefault" | "TenantOverride" | "WorkspaceDefault" | string;
  workspaceDefaultProfile: ModelExecutionProfile;
  lastChangedAtUtc?: string | null;
  lastChangedBy?: string | null;
};

export type ModelAliasTaskEvaluationResponse = {
  taskType: string;
  evaluationState: string;
  evidenceJson?: string | null;
  evaluatedUtc?: string | null;
};

export type ModelAliasRegistryEntryResponse = {
  aliasId: string;
  providerConnectionKind: string;
  capabilityTags: string[];
  approvedTaskTypes: string[];
  structuredOutputLevel?: string;
  dataBoundary?: string;
  taskEvaluations?: ModelAliasTaskEvaluationResponse[];
};

export type WorkspaceAllowedEngineSetResponse = {
  allowedAliasIds: string[];
  defaultAliasId: string;
  source: string;
};

export type WorkspaceAllowedEngineSetUpdateRequest = {
  allowedAliasIds: string[];
  defaultAliasId: string;
};

export type ModelEngineSelectionOptionResponse = {
  aliasId: string;
  structuredOutputLevel: string;
  taskEvaluations: ModelAliasTaskEvaluationResponse[];
};

export type ModelEngineSelectionOptionsResponse = {
  defaultAliasId: string;
  options: ModelEngineSelectionOptionResponse[];
};

export type ModelGovernanceProfileAgentAliasMappingResponse = {
  agentType: string;
  aliasId: string;
};

export type ModelGovernanceProfileMappingResponse = {
  profile: ModelExecutionProfile;
  agentAliasMappings: ModelGovernanceProfileAgentAliasMappingResponse[];
};

export type ModelGovernanceCatalogResponse = {
  workspaceProfile: WorkspaceModelExecutionProfileResponse;
  registryEntries: ModelAliasRegistryEntryResponse[];
  profileMappings: ModelGovernanceProfileMappingResponse[];
};
