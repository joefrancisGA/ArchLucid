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

/** GET /v1/governance/approval-requests/{id}/lineage */
export interface GovernanceLineageRunSummary {
  runId: string;
  status: string;
  createdUtc: string;
  completedUtc: string | null;
  currentManifestVersion: string | null;
}

export interface GovernanceLineageManifestSummary {
  manifestVersion: string | null;
  decisionCount: number;
  unresolvedIssueCount: number;
  complianceGapCount: number;
  /** Present when the Finalized review record verification payload is available. */
  signedBy?: string | null;
  signedUtc?: string | null;
  verificationStatus?: string | null;
  recordDigest?: string | null;
}

export interface GovernanceLineageFindingSummary {
  findingId: string;
  title: string;
  engineType: string;
  severity: string;
  traceCompletenessRatio: number;
  /** Optional link to AgentExecutionTrace.traceId when the finding records it. */
  sourceAgentExecutionTraceId?: string | null;
}

export interface GovernanceLineageResult {
  approvalRequest: GovernanceApprovalRequest;
  run: GovernanceLineageRunSummary | null;
  manifest: GovernanceLineageManifestSummary | null;
  topFindings: GovernanceLineageFindingSummary[];
  riskPosture: string | null;
  promotions: GovernancePromotionRecord[];
}

/** GET /v1/governance/approval-requests/{id}/rationale */
export interface GovernanceRationaleResult {
  schemaVersion: number;
  approvalRequestId: string;
  summary: string;
  bullets: string[];
}

/** POST /v1/governance/approval-requests/batch-review item row */
export interface GovernanceBatchReviewItemResult {
  approvalRequestId?: string;
  succeeded?: boolean;
  errorCode?: string | null;
  message?: string | null;
}

/** POST /v1/governance/approval-requests/batch-review */
export interface GovernanceBatchReviewResponse {
  results?: GovernanceBatchReviewItemResult[];
}
