import type { GovernanceApprovalRequest, GovernancePromotionRecord } from "@/types/governance-workflow";

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
