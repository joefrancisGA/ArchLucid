import type { components } from "@/lib/openapi-schemas";

/** A policy pack containing compliance rules, alert rules, and advisory defaults. */
export type PolicyPack = {
  policyPackId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description: string;
  packType: string;
  distributionScope: string;
  status: string;
  createdUtc: string;
  activatedUtc?: string | null;
  currentVersion: string;
};

/** A published version of a policy pack with its content document. */
export type PolicyPackVersion = {
  policyPackVersionId: string;
  policyPackId: string;
  version: string;
  contentJson: string;
  createdUtc: string;
  isPublished: boolean;
};

/** Assignment of a policy pack version to a scope (project, workspace, or tenant). */
export type PolicyPackAssignment = {
  assignmentId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  policyPackId: string;
  policyPackVersion: string;
  isEnabled: boolean;
  scopeLevel: string;
  isPinned: boolean;
  assignedUtc: string;
};

/** A resolved (effective) policy pack with its content document JSON. */
export type ResolvedPolicyPack = {
  policyPackId: string;
  name: string;
  version: string;
  packType: string;
  contentJson: string;
};

/** The set of all effective (resolved) policy packs for the current scope. */
export type EffectivePolicyPackSet = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  packs: ResolvedPolicyPack[];
};

/** Merged content document from all effective policy packs (rules, defaults, metadata). */
export type PolicyPackContentDocument = {
  complianceRuleIds: string[];
  complianceRuleKeys: string[];
  alertRuleIds: string[];
  compositeAlertRuleIds: string[];
  advisoryDefaults: Record<string, string>;
  metadata: Record<string, string>;
  /** Elicitation questions owned by this pack (ADR 0051 / R8). Optional — absent on legacy packs. */
  elicitationQuestions?: ElicitationQuestion[];
};

/** Whether an elicitation question must be answered before submission or only improves confidence. */
export type ElicitationQuestionTier = "Must" | "Should";

/** The expected data type for the user's answer to an elicitation question. */
export type ElicitationAnswerKind = "Text" | "Bool" | "Number" | "Enum";

/** A single elicitation question owned by a policy pack (ADR 0051 / R8). */
export type ElicitationQuestion = {
  /** Stable, unique key within the pack (e.g. "network-encryption-at-rest"). Max 200 chars. */
  questionKey: string;
  /** Human-readable question text shown in the Socratic intake loop. Max 1 000 chars. */
  prompt: string;
  /** Must = blocks submission; Should = improves confidence only. */
  tier: ElicitationQuestionTier;
  /** Expected answer data type. */
  answerKind: ElicitationAnswerKind;
  /**
   * complianceRuleKeys in the same pack that this question informs.
   * Every entry must match a key in the owning pack's complianceRuleKeys.
   */
  ruleKeys: string[];
};

/** Promoted platform catalog row (`GET /v1/policy-packs/catalog`). */
export type PolicyPackCatalogListItem = components["schemas"]["PolicyPackCatalogListItem"];

/** Catalog entry with snapshot JSON for cloning. */
export type PolicyPackCatalogEntryDetail = components["schemas"]["PolicyPackCatalogEntryDetail"];

/** Workspace policy pack row for tenant opt-in/opt-out (`GET /v1/policy-packs/workspace-selection`). */
export type PolicyPackWorkspaceSelectionItem = {
  policyPackId: string;
  assignmentId: string;
  name: string;
  description: string;
  packType: string;
  currentVersion: string;
  isEnabled: boolean;
  isGloballyActive: boolean;
};

/** Platform registry row for internal bundled pack activation. */
export type PlatformBundledPolicyPackRegistryEntry = {
  bundleContentFile: string;
  displayName: string;
  isGloballyActive: boolean;
  updatedUtc: string;
};
