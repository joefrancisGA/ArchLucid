import type { PolicyPackContentDocument } from "@/types/policy-packs";

export type GovernanceResolutionCandidate = {
  policyPackId: string;
  policyPackName: string;
  version: string;
  scopeLevel: string;
  precedenceRank: number;
  wasSelected: boolean;
  valueJson: string;
  assignmentId: string;
  assignedUtc: string;
};

export type GovernanceResolutionDecision = {
  itemType: string;
  itemKey: string;
  winningPolicyPackId: string;
  winningPolicyPackName: string;
  winningVersion: string;
  winningScopeLevel: string;
  resolutionReason: string;
  candidates: GovernanceResolutionCandidate[];
};

export type GovernanceConflictRecord = {
  itemType: string;
  itemKey: string;
  conflictType: string;
  description: string;
  candidates: GovernanceResolutionCandidate[];
};

export type EffectiveGovernanceResolutionResult = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  effectiveContent: PolicyPackContentDocument;
  decisions: GovernanceResolutionDecision[];
  conflicts: GovernanceConflictRecord[];
  notes: string[];
};
