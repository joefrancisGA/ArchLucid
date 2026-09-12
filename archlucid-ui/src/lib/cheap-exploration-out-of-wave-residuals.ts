/** Relative to repository root (parent of archlucid-ui). */
export const CHEAP_EXPLORATION_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/CHEAP_EXPLORATION_OUT_OF_WAVE_RESIDUALS.md" as const;

export type CheapExplorationOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type CheapExplorationOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: CheapExplorationOutOfWaveResidualStatus;
  readonly notes: string;
};

/** CE-017+ — explicit skips for CE-040 close audit. */
export const CHEAP_EXPLORATION_OUT_OF_WAVE_RESIDUAL_ROWS: readonly CheapExplorationOutOfWaveResidualRow[] =
  [
    {
      item: "Draft-to-draft Compare",
      tracking: "R12 rejected alternative",
      ownerPrompt: "CE-017",
      status: "not-shipped",
      notes: "Compare remains committed-manifest only (SN-014).",
    },
    {
      item: "Finding-comment chat",
      tracking: "ADR 0076 disposition",
      ownerPrompt: "CE-018",
      status: "not-shipped",
      notes: "Disposition is the collab primitive — no chat thread.",
    },
    {
      item: "Unseal to sketch",
      tracking: "ADR 0039",
      ownerPrompt: "CE-030",
      status: "not-shipped",
      notes: "Clone-from-snapshot is the sketch path; sealed parent stays immutable.",
    },
    {
      item: "Pay-per-what-if SKU",
      tracking: "R12 metering",
      ownerPrompt: "CE-036",
      status: "deferred",
      notes: "Career what-if stays capped full pipeline; cheap envelope is Rehearsal-stamped.",
    },
    {
      item: "Live cursors / presence",
      tracking: "ADR 0090 lease",
      ownerPrompt: "CE-039",
      status: "not-shipped",
      notes: "Work-lease (LW-089) is the collab primitive — not live cursors.",
    },
  ];
