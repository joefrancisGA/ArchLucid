/** One authority pipeline stage row (`GET /v1/architecture/review/{runId}/stage-timeline`). */
export type StageTimelineSummary = {
  stageName: string;
  startedUtc: string;
  completedUtc?: string | null;
  outcomeStatus: string;
  durationMs?: number | null;
};
