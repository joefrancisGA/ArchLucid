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

function decisionConfidenceEncodingNote(confidence: number): string {
  if (confidence > 1) {
    return "recorded on a 0–100 scale";
  }

  return "recorded as a 0–1 fraction";
}

/** Labels confidence with encoding so 1.0 is not confused with 100 points (UU-425). */
export function formatRecordedDecisionConfidence(confidence: number | null): string {
  if (confidence === null || !Number.isFinite(confidence)) {
    return "Not recorded";
  }

  const percent = normalizeDecisionConfidencePercent(confidence);

  if (percent === null) {
    return "Not recorded";
  }

  return `${percent}% (${decisionConfidenceEncodingNote(confidence)})`;
}

export function formatRecordedDecisionConfidenceWithPipeline(
  confidence: number | null,
  pipeline: string,
): string {
  const base = formatRecordedDecisionConfidence(confidence);
  const pipelineLabel = formatDecisionPipelineBuyerLabel(pipeline);

  return `${base} · ${pipelineLabel}`;
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

  if (confidencePercent >= LOW_RECORDED_DECISION_CONFIDENCE_THRESHOLD) {
    return null;
  }

  if (selected.length === 0) {
    return null;
  }

  const trimmedSource = input.buyerConfidenceSource?.trim();

  if (trimmedSource !== undefined && trimmedSource.length > 0) {
    return trimmedSource;
  }

  return "Recorded disposition overrides lower pipeline confidence.";
}
