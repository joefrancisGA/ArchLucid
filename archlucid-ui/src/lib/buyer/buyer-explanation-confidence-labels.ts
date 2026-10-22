import type { ExplanationConfidenceDisposition } from "@/lib/runs/run-explanation-confidence-disposition";

/** Buyer-facing labels for aggregate explanation confidence dispositions (BDA-052). */
export function buyerExplanationConfidenceDispositionLabel(
  disposition: ExplanationConfidenceDisposition,
): string {
  switch (disposition) {
    case "PASS":
      return "strong";

    case "WARN":
      return "needs review";

    case "HOLD":
      return "on hold";

    default: {
      const _exhaustive: never = disposition;

      return _exhaustive;
    }
  }
}
