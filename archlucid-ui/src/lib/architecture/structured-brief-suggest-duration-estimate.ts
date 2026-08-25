/** Poll cadence for advisory structured-brief suggest operations (Tier C). */
export const ADVISORY_DRAFT_OPERATION_POLL_INTERVAL_MS = 10_000;

export type StructuredBriefSuggestDurationBand = {
  readonly lowSeconds: number;
  readonly highSeconds: number;
};

/** Honest duration band from overview length until workspace telemetry exists for suggests. */
export function estimateStructuredBriefSuggestDuration(
  overviewTrimmedLength: number,
): StructuredBriefSuggestDurationBand {
  if (overviewTrimmedLength >= 5_000) {
    return { lowSeconds: 45, highSeconds: 120 };
  }

  if (overviewTrimmedLength >= 2_000) {
    return { lowSeconds: 30, highSeconds: 90 };
  }

  return { lowSeconds: 15, highSeconds: 45 };
}

export function formatStructuredBriefSuggestDurationBand(
  band: StructuredBriefSuggestDurationBand,
): string {
  const lowMinutes = Math.max(1, Math.round(band.lowSeconds / 60));
  const highMinutes = Math.max(lowMinutes, Math.round(band.highSeconds / 60));

  if (lowMinutes === highMinutes) {
    return `This usually takes about ${lowMinutes} minute${lowMinutes === 1 ? "" : "s"}.`;
  }

  return `This usually takes about ${lowMinutes}–${highMinutes} minutes for an overview this size.`;
}
