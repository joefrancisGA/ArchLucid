import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export interface PolicyPackChangeLogEntry {
  changeLogId: string;
  policyPackId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  changeType: string;
  changedBy: string;
  changedUtc: string;
  previousValue?: string | null;
  newValue?: string | null;
  summaryText?: string | null;
}

export interface GovernanceDashboardSummary {
  pendingApprovals: GovernanceApprovalRequest[];
  recentDecisions: GovernanceApprovalRequest[];
  recentChanges: PolicyPackChangeLogEntry[];
  pendingCount: number;
}

/** One time bucket from GET /v1/governance/compliance-drift-trend. */
export interface ComplianceDriftTrendPoint {
  bucketUtc: string;
  changeCount: number;
  changesByType: Record<string, number>;
}
