import type { components } from "@/lib/openapi-schemas";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

type GovernanceResolutionCandidateSchema = components["schemas"]["GovernanceResolutionCandidate"];

export type GovernanceResolutionCandidate = GovernanceResolutionCandidateSchema &
  Required<
    Pick<
      GovernanceResolutionCandidateSchema,
      | "assignmentId"
      | "policyPackId"
      | "policyPackName"
      | "precedenceRank"
      | "scopeLevel"
      | "valueJson"
      | "version"
      | "assignedUtc"
      | "wasSelected"
    >
  >;

type GovernanceResolutionDecisionSchema = components["schemas"]["GovernanceResolutionDecision"];

export type GovernanceResolutionDecision = Omit<GovernanceResolutionDecisionSchema, "candidates"> &
  Required<
    Pick<
      GovernanceResolutionDecisionSchema,
      | "itemType"
      | "itemKey"
      | "winningPolicyPackId"
      | "winningPolicyPackName"
      | "winningVersion"
      | "winningScopeLevel"
      | "resolutionReason"
    >
  > & {
    candidates: GovernanceResolutionCandidate[];
  };

type GovernanceConflictRecordSchema = components["schemas"]["GovernanceConflictRecord"];

export type GovernanceConflictRecord = Omit<GovernanceConflictRecordSchema, "candidates"> &
  Required<
    Pick<GovernanceConflictRecordSchema, "itemType" | "itemKey" | "conflictType" | "description">
  > & {
    candidates: GovernanceResolutionCandidate[];
  };

type EffectiveGovernanceResolutionResultSchema = components["schemas"]["EffectiveGovernanceResolutionResult"];

/** Full policy resolution result: effective content, merge decisions, and any conflicts. */
export type EffectiveGovernanceResolutionResult = Omit<
  EffectiveGovernanceResolutionResultSchema,
  "effectiveContent" | "decisions" | "conflicts"
> &
  Required<
    Pick<
      EffectiveGovernanceResolutionResultSchema,
      "tenantId" | "workspaceId" | "projectId" | "notes"
    >
  > & {
    effectiveContent: PolicyPackContentDocument;
    decisions: GovernanceResolutionDecision[];
    conflicts: GovernanceConflictRecord[];
  };
