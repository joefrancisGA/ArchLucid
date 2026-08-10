export const LOW_RECORDED_DECISION_CONFIDENCE_THRESHOLD = 50;

export function normalizeDecisionConfidencePercent(confidence: number | null): number | null {
  if (confidence === null || !Number.isFinite(confidence)) {
    return null;
  }

  if (confidence <= 1) {
    return Math.round(confidence * 100);
  }

  return Math.round(confidence);
}

export function formatDecisionPipelineBuyerLabel(pipeline: string): string {
  const normalized = pipeline.trim().toLowerCase();

  if (normalized.length === 0) {
    return "Review pipeline";
  }

  if (normalized.includes("authority")) {
    return "Authority rules";
  }

  if (normalized.includes("coordinator")) {
    return "Coordinator merge";
  }

  if (normalized.includes("manifest")) {
    return "Review record";
  }

  return "Review pipeline";
}

export function resolveRecordedDecisionConfidenceNote(input: {
  readonly selectedOption: string;
  readonly confidence: number | null;
  readonly buyerConfidenceSource: string | null;
}): string | null {
  const confidencePercent = normalizeDecisionConfidencePercent(input.confidence);
  const selected = input.selectedOption.trim().toLowerCase();

  if (confidencePercent === null) {
    return null;
  }

  const isRecordedDisposition =
    selected.includes("accept") || selected.includes("approv") || selected.includes("record");

  if (!isRecordedDisposition || confidencePercent >= LOW_RECORDED_DECISION_CONFIDENCE_THRESHOLD) {
    return null;
  }

  const trimmedSource = input.buyerConfidenceSource?.trim();

  if (trimmedSource !== undefined && trimmedSource.length > 0) {
    return trimmedSource;
  }

  return "Recorded disposition overrides lower pipeline confidence.";
}
