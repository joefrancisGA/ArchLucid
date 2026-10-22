/** Relative to repository root (parent of archlucid-ui). */
export const MODE_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/MODE_GRAVITY_OUT_OF_WAVE_RESIDUALS.md" as const;

export type ModeGravityOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type ModeGravityOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: ModeGravityOutOfWaveResidualStatus;
  readonly notes: string;
};

/** MG-013 / MG-014 — explicit skips recorded for MG-024 close audit; do not pretend shipped. */
export const MODE_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS: readonly ModeGravityOutOfWaveResidualRow[] = [
  {
    item: "Delete Guided workspace mode",
    tracking: "Out of product",
    ownerPrompt: "MG-013",
    status: "not-shipped",
    notes:
      "Guided stays eval teaching product (ADR 0080). Deleting Guided recreates teaching on Working.",
  },
  {
    item: "Flip host AgentExecution:Mode default to Real",
    tracking: "GTM G-REAL-06",
    ownerPrompt: "MG-014",
    status: "not-shipped",
    notes: "AS-085 ratchet; appsettings stay Simulator. G-REAL-06 stays GTM owner. Career vs Rehearsal is chrome + stamp.",
  },
];
