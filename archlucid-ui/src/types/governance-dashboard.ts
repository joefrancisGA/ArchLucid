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
