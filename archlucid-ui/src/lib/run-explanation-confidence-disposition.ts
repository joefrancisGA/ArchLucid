import type { RunExplanationSummary } from "@/types/explanation";

export type ExplanationConfidenceDisposition = "PASS" | "WARN" | "HOLD";

export type ExplanationConfidenceSummary = {
  readonly disposition: ExplanationConfidenceDisposition;
  readonly title: string;
  readonly detail: string;
};

function usedDeterministicFallback(summary: RunExplanationSummary): boolean {
  return summary.deterministicFallbackUsed === true;
}

function readFaithfulnessRatio(summary: RunExplanationSummary): number | null {
  const ratio = summary.faithfulnessSupportRatio;

  if (typeof ratio === "number" && Number.isFinite(ratio))
    return ratio;

  if (typeof ratio === "string" && ratio.trim().length > 0) {
    const parsed = Number(ratio);

    if (Number.isFinite(parsed))
      return parsed;
  }

  return null;
}

/** Maps aggregate explanation faithfulness signals to sponsor-handoff vocabulary (#20). */
export function buildExplanationConfidenceSummary(
  summary: RunExplanationSummary | null,
): ExplanationConfidenceSummary | null {
  if (summary === null)
    return null;

  const ratio = readFaithfulnessRatio(summary);
  const warning =
    typeof summary.faithfulnessWarning === "string" ? summary.faithfulnessWarning.trim() : "";

  if (usedDeterministicFallback(summary)) {
    return {
      disposition: "HOLD",
      title: "Explanation uses deterministic fallback",
      detail:
        warning.length > 0
          ? warning
          : "Faithfulness was too low for sponsor-safe LLM narrative — review manifest-backed text before external send.",
    };
  }

  if (typeof ratio === "number" && Number.isFinite(ratio)) {
    if (ratio < 0.5) {
      return {
        disposition: "HOLD",
        title: "Low explanation faithfulness",
        detail:
          warning.length > 0
            ? warning
            : `Faithfulness support ratio is ${Math.round(ratio * 100)}% — treat narrative as unsupported for sponsor send.`,
      };
    }

    if (ratio < 0.8) {
      return {
        disposition: "WARN",
        title: "Partial explanation support",
        detail:
          warning.length > 0
            ? warning
            : `Faithfulness support ratio is ${Math.round(ratio * 100)}% — review citations before external send.`,
      };
    }
  }

  if (warning.length > 0) {
    return {
      disposition: "WARN",
      title: "Explanation caveat",
      detail: warning,
    };
  }

  if (summary.citations !== undefined && summary.citations !== null && summary.citations.length === 0) {
    return {
      disposition: "WARN",
      title: "No persisted citations on aggregate explanation",
      detail: "Narrative loaded without citation chips — verify findings and manifest artifacts before sponsor send.",
    };
  }

  return null;
}
