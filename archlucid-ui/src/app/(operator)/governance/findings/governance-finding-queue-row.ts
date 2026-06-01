import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { FindingConfidenceLevel } from "@/types/explanation";

/** Distinguishes explainability-backed findings from recorded architecture decisions in the mixed queue. */
export type GovernanceFindingQueueRecordKind = "finding" | "decision";

export type GovernanceFindingQueueRow = {
  runId: string;
  runLabel: string;
  /** Canonical manifest UUID when known, or "—". */
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
  agingDays?: number;
  waiverExpiresAtUtc?: string | null;
  revisitDueUtc?: string | null;
  isStale?: boolean;
  evidenceHref?: string;
  /** TB-063: inbound sync human review state for architecture risk register rows. */
  humanReviewStatusLabel?: string | null;
  /** TB-063: aggregated ITSM correlation summary (e.g. Jira:KEY-1). */
  itsmLinkedTicketsSummary?: string | null;
};

export function formatGovernanceQueueRecordKind(
  kind: GovernanceFindingQueueRecordKind,
  buyerPolishedShell: boolean,
): string {
  if (kind === "decision") {
    return buyerPolishedShell ? "Decision" : "Architecture decision";
  }

  return buyerPolishedShell ? BUYER_SURFACE_VOCABULARY.finding : "Finding";
}
