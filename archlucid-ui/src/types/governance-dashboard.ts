import type { components } from "@/lib/openapi-schemas";
import type {
  GovernanceApprovalRequest,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";

type PolicyPackChangeLogEntrySchema = components["schemas"]["PolicyPackChangeLogEntry"];

export type PolicyPackChangeLogEntry = PolicyPackChangeLogEntrySchema &
  Required<
    Pick<
      PolicyPackChangeLogEntrySchema,
      | "changeLogId"
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "policyPackId"
      | "changeType"
      | "changedBy"
      | "changedUtc"
      | "summaryText"
      | "previousValue"
      | "newValue"
    >
  >;

type GovernanceDashboardSummarySchema = components["schemas"]["GovernanceDashboardSummary"];

export type GovernanceDashboardSummary = Omit<
  GovernanceDashboardSummarySchema,
  "pendingApprovals" | "recentDecisions" | "recentChanges"
> &
  Required<Pick<GovernanceDashboardSummarySchema, "pendingCount">> & {
    pendingApprovals: GovernanceApprovalRequest[];
    recentDecisions: GovernanceApprovalRequest[];
    recentChanges: PolicyPackChangeLogEntry[];
  };

/** One time bucket from GET /v1/governance/compliance-drift-trend. */
export type ComplianceDriftTrendPoint = components["schemas"]["ComplianceDriftTrendPoint"];

/** GET /v1/governance/approval-requests/{id}/lineage */
export type GovernanceLineageRunSummary = components["schemas"]["GovernanceLineageRunSummary"];

export type GovernanceLineageManifestSummary = components["schemas"]["GovernanceLineageManifestSummary"];

export type GovernanceLineageFindingSummary = components["schemas"]["GovernanceLineageFindingSummary"];

export type GovernanceLineageResult = components["schemas"]["GovernanceLineageResult"];

/** GET /v1/governance/approval-requests/{id}/rationale */
export type GovernanceRationaleResult = components["schemas"]["GovernanceRationaleResult"];

/** POST /v1/governance/approval-requests/batch-review item row */
export type GovernanceBatchReviewItemResult = components["schemas"]["GovernanceBatchReviewItemResult"];

/** POST /v1/governance/approval-requests/batch-review */
export type GovernanceBatchReviewResponse = components["schemas"]["GovernanceBatchReviewResponse"];
