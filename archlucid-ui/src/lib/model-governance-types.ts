import type { ModelExecutionProfile } from "@/lib/model-execution-profile";

export type WorkspaceModelExecutionProfileResponse = {
  effectiveProfile: ModelExecutionProfile;
  source: "HostDefault" | "TenantOverride" | "WorkspaceDefault" | string;
  workspaceDefaultProfile: ModelExecutionProfile;
  lastChangedAtUtc?: string | null;
  lastChangedBy?: string | null;
};

export type ModelAliasRegistryEntryResponse = {
  aliasId: string;
  providerConnectionKind: string;
  capabilityTags: string[];
  approvedTaskTypes: string[];
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
