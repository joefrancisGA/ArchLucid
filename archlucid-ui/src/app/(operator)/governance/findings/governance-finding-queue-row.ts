import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import type { FindingConfidenceLevel } from "@/types/explanation";
import type { components } from "@/lib/api-types/schemas.generated";
import type { FindingSemanticSupportBandValue } from "@/lib/findings/semantic-support-band-presentation";

type FindingClassification = components["schemas"]["FindingClassification"];

/** Distinguishes explainability-backed findings from recorded architecture decisions in the mixed queue. */
export type GovernanceFindingQueueRecordKind = "finding" | "decision";

export type GovernanceFindingQueueRow = {
  runId: string;
  runLabel: string;
  /** Canonical manifest UUID when known, or empty when absent. */
  manifestId: string;
  findingId: string;
  title: string;
  severity: string;
  category: string;
  status: string;
  recommended: string;
  recordKind: GovernanceFindingQueueRecordKind;
  traceConfidenceLevel?: FindingConfidenceLevel | null;
  ownerUserId?: string | null;
  latestDisposition?: string | null;
  agingDays?: number;
  waiverExpiresAtUtc?: string | null;
  lastReviewedUtc?: string | null;
  revisitDueUtc?: string | null;
  isStale?: boolean;
  evidenceHref?: string;
  evidenceRefCount?: number | null;
  /** TB-063: inbound sync human review state for architecture risk register rows. */
  humanReviewStatusLabel?: string | null;
  /** TB-063: aggregated ITSM correlation summary (e.g. Jira:KEY-1). */
  itsmLinkedTicketsSummary?: string | null;
  /** Compliance rule key when known from explainability or risk register category. */
  policyRuleId?: string | null;
  /** Architecture request system name when returned by the risk register API. */
  systemName?: string | null;
  /** Affected cloud resource identifier when returned by the risk register API. */
  resourceId?: string | null;
  /** Advisory insight-density score when returned by explainability (sort only; never demotes). */
  insightDensityScore?: number | null;
  /** Gate classification after ADR 0070 when returned by explainability. */
  classification?: FindingClassification | null;
  /** Insight-density treatment when returned by explainability (`FindingTreatment`: 0=Promote, 1=DemoteToChecklist). */
  treatment?: number | null;
  /** AS-061 semantic support band when returned by explainability trace rows. */
  semanticSupportBand?: FindingSemanticSupportBandValue | null;
};

/** Queue rows without a stored review id must not link into review-scoped finding surfaces. */
export function governanceFindingQueueRowHasStoredRunId(row: GovernanceFindingQueueRow): boolean {
  return row.runId.trim().length > 0;
}

/** Review hub href for a queue row run id; trims padding before encoding. */
export function governanceFindingQueueRowReviewHref(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId.trim())}`;
}

/** Optional API policy rule keys must be non-empty after trim before traceability chrome renders. */
export function governanceFindingQueueRowHasPolicyRuleId(row: GovernanceFindingQueueRow): boolean {
  return row.policyRuleId != null && row.policyRuleId.trim().length > 0;
}

/** Policy-area fallback copy must not render for whitespace-only category strings on queue rows. */
export function governanceFindingQueueRowHasDisplayCategory(row: GovernanceFindingQueueRow): boolean {
  return row.recordKind === "finding" && row.category.trim().length > 0;
}

export const GOVERNANCE_QUEUE_RECORD_ROLE_DECISION_HONESTY =
  "Decision rows record architecture choices — severity and finding confidence do not apply." as const;

export const GOVERNANCE_QUEUE_RECORD_ROLE_FINDING_HONESTY =
  "Finding rows carry severity and trace confidence when the API stored them." as const;

export function formatGovernanceQueueRecordKind(
  kind: GovernanceFindingQueueRecordKind,
  buyerPolishedShell: boolean,
): string {
  if (kind === "decision") {
    return buyerPolishedShell ? "Decision" : "Architecture decision";
  }

  return buyerPolishedShell ? BUYER_SURFACE_VOCABULARY.finding : "Finding";
}

export function formatGovernanceQueueRecordRoleHonesty(
  kind: GovernanceFindingQueueRecordKind,
): string {
  return kind === "decision"
    ? GOVERNANCE_QUEUE_RECORD_ROLE_DECISION_HONESTY
    : GOVERNANCE_QUEUE_RECORD_ROLE_FINDING_HONESTY;
}
