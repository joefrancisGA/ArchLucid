export type PolicyPack = {
  policyPackId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description: string;
  packType: string;
  status: string;
  createdUtc: string;
  activatedUtc?: string | null;
  currentVersion: string;
};

export type PolicyPackVersion = {
  policyPackVersionId: string;
  policyPackId: string;
  version: string;
  contentJson: string;
  createdUtc: string;
  isPublished: boolean;
};

export type PolicyPackAssignment = {
  assignmentId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  policyPackId: string;
  policyPackVersion: string;
  isEnabled: boolean;
  assignedUtc: string;
};

export type ResolvedPolicyPack = {
  policyPackId: string;
  name: string;
  version: string;
  packType: string;
  contentJson: string;
};

export type EffectivePolicyPackSet = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  packs: ResolvedPolicyPack[];
};

export type PolicyPackContentDocument = {
  complianceRuleIds: string[];
  alertRuleIds: string[];
  compositeAlertRuleIds: string[];
  advisoryDefaults: Record<string, string>;
  metadata: Record<string, string>;
};
