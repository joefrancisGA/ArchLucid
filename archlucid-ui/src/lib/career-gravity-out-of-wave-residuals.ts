/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md" as const;

export type CareerGravityOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type CareerGravityOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: CareerGravityOutOfWaveResidualStatus;
  readonly notes: string;
};

/** CG-098+ — explicit skips recorded for CG-100 close audit; do not pretend shipped. */
export const CAREER_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS: readonly CareerGravityOutOfWaveResidualRow[] = [
  {
    item: "In-app changelog / What's new",
    tracking: "Product backlog",
    ownerPrompt: "CG-098",
    status: "not-shipped",
    notes:
      "Explicitly out of wave (LW-100 residual). Gravity is doors and stamps, not a product blog. Prompt exists so nobody fills the gap.",
  },
];
