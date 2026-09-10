import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import type { ActorSet, DraftRequestDocument } from "@/types/draft-intake";

export type LivelihoodPendingMutationKind =
  | "finding_disposition"
  | "governance_mutation_correction"
  | "architecture_draft_patch"
  | "finding_bulk_disposition"
  | "governance_workflow_transition"
  | "architecture_review_finalize"
  | "policy_pack_save"
  | "itsm_connector_save"
  | "architecture_share_grant"
  | "risk_exception_write";

export const LIVELIHOOD_PENDING_MUTATION_KINDS: readonly LivelihoodPendingMutationKind[] = [
  "finding_disposition",
  "governance_mutation_correction",
  "architecture_draft_patch",
  "finding_bulk_disposition",
  "governance_workflow_transition",
  "architecture_review_finalize",
  "policy_pack_save",
  "itsm_connector_save",
  "architecture_share_grant",
  "risk_exception_write",
] as const;

export function isLivelihoodPendingMutationKind(value: string): value is LivelihoodPendingMutationKind {
  return (LIVELIHOOD_PENDING_MUTATION_KINDS as readonly string[]).includes(value);
}

export type FindingDispositionPendingPayload = {
  readonly findingId: string;
  readonly body: {
    readonly disposition: FindingDispositionKind;
    readonly rationale?: string;
    readonly runId: string;
    readonly revisitDueUtc?: string;
    readonly evidenceRequestText?: string;
    readonly tradeOffAcknowledgment?: string;
    readonly expectedCurrentDispositionRowVersionBase64?: string;
    readonly impactPreviewCompleted?: boolean;
    readonly previewOverrideReason?: string;
    readonly architectRestatement?: string;
  };
};

export type GovernanceMutationCorrectionPendingPayload = {
  readonly body: {
    readonly mutationKind: string;
    readonly subjectId: string;
    readonly runId: string;
    readonly rationale: string;
  };
};

export type ArchitectureDraftPatchPendingPayload = {
  readonly draftId: string;
  readonly body: {
    readonly freeTextIntent?: string;
    readonly systemName?: string;
    readonly businessOutcome?: string;
    readonly actorSet?: ActorSet;
    readonly focusedPilotModeEnabled?: boolean;
    readonly workflowIntent?: "create-architecture" | "start-review";
    readonly structuredBrief?: DraftRequestDocument["structuredBrief"];
    readonly openQuestions?: string;
    readonly expectedUpdatedUtc?: string;
    readonly forceOverwrite?: boolean;
  };
};

export type FindingBulkDispositionPendingPayload = {
  readonly body: {
    readonly findingIds: readonly string[];
    readonly disposition: FindingDispositionKind;
    readonly rationale?: string;
    readonly revisitDueUtc?: string;
    readonly expectedCurrentDispositionRowVersionBase64ByFindingId?: Record<string, string>;
  };
};

export type GovernanceWorkflowTransitionAction =
  | "submit_approval"
  | "approve"
  | "reject"
  | "promote"
  | "activate";

export type GovernanceWorkflowTransitionPendingPayload = {
  readonly action: GovernanceWorkflowTransitionAction;
  readonly approvalRequestId?: string;
  readonly body: Record<string, unknown>;
};

export type ArchitectureReviewFinalizePendingPayload = {
  readonly runId: string;
  readonly body: {
    readonly notifySponsor: boolean;
    readonly acknowledgedAssumptionIds: readonly string[];
  };
};

export type PolicyPackSaveOperation = "create" | "publish";

export type PolicyPackSavePendingPayload = {
  readonly operation: PolicyPackSaveOperation;
  readonly policyPackId?: string;
  readonly body: Record<string, unknown>;
  /** Publish is persisted on 401 but not auto-replayed (LW-059). */
  readonly autoReplay: boolean;
};

export type ItsmConnectorId =
  | "azureboards_connection"
  | "azureboards_settings"
  | "jira_settings"
  | "servicenow_settings"
  | "teams_webhook";

export type ItsmConnectorSavePendingPayload = {
  readonly connector: ItsmConnectorId;
  readonly body: Record<string, unknown>;
};

export type ArchitectureShareGrantOperation = "grant" | "revoke" | "restrict";

export type ArchitectureShareGrantPendingPayload = {
  readonly architectureId: string;
  readonly operation: ArchitectureShareGrantOperation;
  readonly targetActorOid?: string;
  readonly body?: Record<string, unknown>;
};

export type RiskExceptionWriteOperation = "renew" | "revoke";

export type RiskExceptionWritePendingPayload = {
  readonly riskExceptionId: string;
  readonly operation: RiskExceptionWriteOperation;
  readonly body?: {
    readonly expiresAtUtc?: string;
    readonly rationale?: string;
    readonly evidenceRef?: string;
  };
};

export type LivelihoodPendingMutationPayload =
  | FindingDispositionPendingPayload
  | GovernanceMutationCorrectionPendingPayload
  | ArchitectureDraftPatchPendingPayload
  | FindingBulkDispositionPendingPayload
  | GovernanceWorkflowTransitionPendingPayload
  | ArchitectureReviewFinalizePendingPayload
  | PolicyPackSavePendingPayload
  | ItsmConnectorSavePendingPayload
  | ArchitectureShareGrantPendingPayload
  | RiskExceptionWritePendingPayload;

export type LivelihoodPendingMutation = {
  readonly kind: LivelihoodPendingMutationKind;
  readonly idempotencyKey: string;
  readonly returnPath: string;
  readonly savedAtUtc: string;
  readonly requestLeftClient: boolean;
  readonly payload: LivelihoodPendingMutationPayload;
};
