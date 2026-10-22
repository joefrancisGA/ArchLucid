import type { components } from "@/lib/openapi-schemas";

type GovernanceApprovalRequestSchema = components["schemas"]["GovernanceApprovalRequest"];

/** Approval workflow row (v1/governance); mirrors ArchLucid.Contracts.Governance.GovernanceApprovalRequest JSON. */
export type GovernanceApprovalRequest = GovernanceApprovalRequestSchema &
  Required<
    Pick<
      GovernanceApprovalRequestSchema,
      | "approvalRequestId"
      | "runId"
      | "manifestVersion"
      | "sourceEnvironment"
      | "targetEnvironment"
      | "status"
      | "requestedBy"
      | "requestedUtc"
    >
  > & {
    reviewedBy: string | null;
    requestComment: string | null;
    reviewComment: string | null;
    reviewedUtc: string | null;
    /** Optional — present when SLA is configured for the request. */
    slaDeadlineUtc?: string | null;
    slaBreachNotifiedUtc?: string | null;
  };

type GovernancePromotionRecordSchema = components["schemas"]["GovernancePromotionRecord"];

/**
 * Promotion audit row; wire uses promotionRecordId (C# PromotionRecordId).
 * Prompt alias "promotionId" refers to this identifier.
 */
export type GovernancePromotionRecord = GovernancePromotionRecordSchema &
  Required<
    Pick<
      GovernancePromotionRecordSchema,
      | "promotionRecordId"
      | "runId"
      | "manifestVersion"
      | "sourceEnvironment"
      | "targetEnvironment"
      | "promotedBy"
      | "promotedUtc"
    >
  > & {
    approvalRequestId: string | null;
    notes: string | null;
  };

type GovernanceEnvironmentActivationSchema = components["schemas"]["GovernanceEnvironmentActivation"];

/** Environment activation row; API does not return activatedBy (actor comes from server context). */
export type GovernanceEnvironmentActivation = GovernanceEnvironmentActivationSchema &
  Required<
    Pick<
      GovernanceEnvironmentActivationSchema,
      | "activationId"
      | "runId"
      | "manifestVersion"
      | "environment"
      | "isActive"
      | "activatedUtc"
    >
  >;
