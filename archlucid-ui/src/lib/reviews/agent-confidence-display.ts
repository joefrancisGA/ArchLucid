import type { RunDetailAgentResult } from "@/types/authority";

function parseConfidence(confidence: number | string | null | undefined): number | null {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const n = typeof confidence === "string" ? Number.parseFloat(confidence) : confidence;

  if (!Number.isFinite(n)) {
    return null;
  }

  return n;
}

function formatConfidencePercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatAgentExecutionConfidenceLabel(result: RunDetailAgentResult): string {
  const raw = parseConfidence(result.confidence);
  const calibrated = parseConfidence(result.calibratedConfidence);

  if (calibrated !== null && raw !== null && Math.abs(calibrated - raw) >= 0.0005) {
    return `Calibrated ${formatConfidencePercent(calibrated)} (raw ${formatConfidencePercent(raw)})`;
  }

  if (calibrated !== null) {
    return `Calibrated ${formatConfidencePercent(calibrated)}`;
  }

  if (raw !== null) {
    return `Raw ${formatConfidencePercent(raw)}`;
  }

  return "Not recorded";
}
