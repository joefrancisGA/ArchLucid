/** GET /v1/architecture/review/{runId}/findings/{findingId}/inspect */
import type { FindingConfidenceLevel } from "@/types/explanation";

export type FindingInspectEvidence = {
  artifactId: string | null;
  lineRange: string | null;
  excerpt: string | null;
};

export type FindingInspectPayload = {
  findingId: string;
  typedPayload: unknown;
  decisionRuleId: string | null;
  decisionRuleName: string | null;
  evidence: FindingInspectEvidence[];
  /** Deterministic template-built narrative from inspect API when metadata is sufficient. */
  reasoningSummary?: string | null;
  /** Ordered recommended actions from the finding engine. Empty array when none were produced. */
  recommendedActions: string[];
  auditRowId: string | null;
  runId: string;
  manifestVersion: string | null;
  /** Inspect API fields when returned (FindingInspectResponse). */
  modelDeploymentName?: string | null;
  modelAlias?: string | null;
  promptTemplateVersion?: string | null;
  isMuted?: boolean;
  muteReason?: string | null;
  reasoningTrace?: string | null;
  evaluationConfidenceScore?: number | null;
  confidenceLevel?: FindingConfidenceLevel | null;
  /** Inbound ITSM sync / operator human review state when returned by inspect API. */
  humanReviewStatus?: number | null;
  /** TB-395 general remediation assignee (not disposition reviewer). */
  assignedToUserId?: string | null;
  /** TB-395 target remediation due (not deferral revisit). */
  remediationDueUtc?: string | null;
  /** Authoritative trust label from inspect API enrichment. */
  trustLabel?: string | null;
  /** Short reason accompanying trustLabel. */
  trustLabelReason?: string | null;
};
