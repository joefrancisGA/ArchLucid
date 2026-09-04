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
export interface ComplianceDriftTrendPoint {
  bucketUtc: string;
  changeCount: number;
  changesByType: Record<string, number>;
  /** Findings captured (`FindingsSnapshotSealed` audit events) in this bucket. */
  openFindingsCount?: number;
  /** Human review dispositions in this bucket. */
  resolvedFindingsCount?: number;
}
