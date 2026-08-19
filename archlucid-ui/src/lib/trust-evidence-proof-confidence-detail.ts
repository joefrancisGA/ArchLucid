import { PROOF_CONFIDENCE_LABELS } from "@/lib/proof-confidence-taxonomy";

/**
 * Explanatory copy for the Proof confidence field on the Evidence basis card.
 *
 * Proof confidence and Execution mode previously rendered the *same* detail string, so two adjacent
 * tiles read as duplicated content. Proof confidence explains what the classification means for a
 * sponsor; Execution mode keeps the persisted runtime label from the API.
 */
const PROOF_CONFIDENCE_DETAILS: Record<string, string> = {
  [PROOF_CONFIDENCE_LABELS["full-real-mode"]]:
    "Findings in this review were produced against live analysis, so claims trace to real execution.",
  [PROOF_CONFIDENCE_LABELS["partial-real-mode"]]:
    "Some steps ran live and some fell back to deterministic analysis — check exceptions before quoting results to a sponsor.",
  [PROOF_CONFIDENCE_LABELS["simulator-only"]]:
    "This review ran on deterministic analysis only. Treat it as a rehearsal, not evidence of live behavior.",
  [PROOF_CONFIDENCE_LABELS.unknown]:
    "This review has no recorded proof classification, so the strength of its evidence cannot be asserted.",
};

/** Sponsor-facing explanation for a canonical proof-confidence label. */
export function proofConfidenceFieldDetail(label: string): string | null {
  return PROOF_CONFIDENCE_DETAILS[label.trim()] ?? null;
}
