import {
  normalizeFindingSemanticSupportBand,
  resolveDecisionGradeSemanticSupportBand,
} from "@/lib/findings/semantic-support-band-presentation";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

/**
 * Reads `typedPayload.semanticSupportBand` for inspect/job-view mapping.
 * Lives in lib (not a client-component module) so server components can call it.
 */
export function findingSemanticSupportBandFromTypedPayload(
  typedPayload: Record<string, unknown> | null,
  classification: QuickDecisionFinding["classification"],
): QuickDecisionFinding["semanticSupportBand"] {
  const band = normalizeFindingSemanticSupportBand(typedPayload?.semanticSupportBand);

  if (classification === "ChecklistCoverage") {
    return band;
  }

  return band ?? resolveDecisionGradeSemanticSupportBand(null);
}
