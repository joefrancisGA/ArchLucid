import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";

/** Minimal QuickDecisionFinding shape for IH-042 support-band chip on queue rows. */
export function governanceQueueRowToSemanticSupportChipFinding(
  row: GovernanceFindingQueueRow,
): QuickDecisionFinding | null {
  if (row.recordKind !== "finding") {
    return null;
  }

  if (row.semanticSupportBand === null || row.semanticSupportBand === undefined) {
    return null;
  }

  const classification =
    row.classification === "ChecklistCoverage"
      ? "ChecklistCoverage"
      : FINDING_CLASSIFICATION_DECISION_GRADE;

  return {
    findingId: row.findingId,
    title: row.title,
    recommendation: row.recommended,
    severityValue: 0,
    findingOrder: 0,
    aiReasoning: { finding: {}, reasoningTrace: null },
    isMuted: false,
    muteReason: null,
    enforcementTier: "Advisory",
    semanticSupportBand: row.semanticSupportBand,
    classification,
    insightDensityScore: row.insightDensityScore ?? null,
    evidenceRefCount: row.evidenceRefCount ?? null,
  };
}
