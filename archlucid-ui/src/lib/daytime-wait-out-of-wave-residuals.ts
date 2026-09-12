/** Relative to repository root (parent of archlucid-ui). */
export const DAYTIME_WAIT_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/DAYTIME_WAIT_OUT_OF_WAVE_RESIDUALS.md" as const;

export type DaytimeWaitOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type DaytimeWaitOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: DaytimeWaitOutOfWaveResidualStatus;
  readonly notes: string;
};

/** DW-018+ — explicit skips for DW-024 close audit. */
export const DAYTIME_WAIT_OUT_OF_WAVE_RESIDUAL_ROWS: readonly DaytimeWaitOutOfWaveResidualRow[] = [
  {
    item: "GET /v1/runs/{runId}/progress",
    tracking: "TB-2072 non-claim",
    ownerPrompt: "DW-018",
    status: "not-shipped",
    notes: "Use GET /v1/operations/{operationId} (TB-2074).",
  },
  {
    item: "Gate 1 live review SLA",
    tracking: "LN-012",
    ownerPrompt: "DW-023",
    status: "deferred",
    notes: "Performance baselines doc honesty only — not a live SLA claim.",
  },
];
