import type { RecentPilotRunDeltasPayload } from "@/components/BeforeAfterDelta/types";

export type WorkspaceReviewDurationEstimate = {
  readonly p50Seconds: number;
  readonly p90Seconds: number;
  readonly sampleSize: number;
};

const MIN_SAMPLE_SIZE = 2;

export function computeDurationPercentile(sortedAscending: readonly number[], percentile: number): number | null {
  if (sortedAscending.length === 0 || !Number.isFinite(percentile)) {
    return null;
  }

  if (sortedAscending.length === 1) {
    return sortedAscending[0] ?? null;
  }

  const clamped = Math.min(100, Math.max(0, percentile));
  const index = (clamped / 100) * (sortedAscending.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedAscending[lower] ?? null;
  }

  const lowerValue = sortedAscending[lower];
  const upperValue = sortedAscending[upper];

  if (lowerValue === undefined || upperValue === undefined) {
    return null;
  }

  return lowerValue + (upperValue - lowerValue) * (index - lower);
}

export function deriveWorkspaceReviewDurationEstimate(
  payload: RecentPilotRunDeltasPayload | null | undefined,
): WorkspaceReviewDurationEstimate | null {
  if (payload === null || payload === undefined) {
    return null;
  }

  const durationsSeconds = payload.items
    .map((row) => row.timeToCommittedManifestTotalSeconds)
    .filter((seconds): seconds is number => seconds !== null && Number.isFinite(seconds) && seconds > 0);

  if (durationsSeconds.length < MIN_SAMPLE_SIZE) {
    return null;
  }

  const sorted = [...durationsSeconds].sort((left, right) => left - right);
  const p50Seconds = computeDurationPercentile(sorted, 50);
  const p90Seconds = computeDurationPercentile(sorted, 90);

  if (p50Seconds === null || p90Seconds === null) {
    return null;
  }

  return {
    p50Seconds,
    p90Seconds,
    sampleSize: durationsSeconds.length,
  };
}

export function formatReviewDurationMinutes(totalSeconds: number): string {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));

  return `${minutes} min`;
}

export function formatWorkspaceReviewDurationBand(estimate: WorkspaceReviewDurationEstimate): string {
  const lowMinutes = Math.max(1, Math.round(estimate.p50Seconds / 60));
  const highMinutes = Math.max(lowMinutes, Math.round(estimate.p90Seconds / 60));

  return `Recent reviews in this workspace typically take ${lowMinutes}–${highMinutes} minutes.`;
}
