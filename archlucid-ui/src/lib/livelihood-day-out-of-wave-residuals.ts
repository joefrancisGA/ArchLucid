/** Relative to repository root (parent of archlucid-ui). */
export const LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUALS.md" as const;

export type LivelihoodDayOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type LivelihoodDayOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: LivelihoodDayOutOfWaveResidualStatus;
  readonly notes: string;
};

/** LY-043 / 046 / 058 / 059 / 116–118 — explicit skips for LY-120 close audit. */
export const LIVELIHOOD_DAY_OUT_OF_WAVE_RESIDUAL_ROWS: readonly LivelihoodDayOutOfWaveResidualRow[] =
  [
    {
      item: "G-REAL-06 / host AgentExecution:Mode flip",
      tracking: "LN-026 / GTM",
      ownerPrompt: "LY-116",
      status: "not-shipped",
      notes: "Host Mode stays Simulator. Real finalize judge does not flip Mode.",
    },
    {
      item: "Draft-to-draft Compare",
      tracking: "R12 / SN-038 / CE-017",
      ownerPrompt: "LY-117",
      status: "not-shipped",
      notes: "Compare remains committed-manifest only. LY-046 is the skip; do not implement draft-diff.",
    },
    {
      item: "Live presence (avatars, cursors, occupancy heartbeats)",
      tracking: "ADR 0090 / SN-039 / CE-018",
      ownerPrompt: "LY-118",
      status: "not-shipped",
      notes: "Work-lease is the collab primitive — not live presence.",
    },
    {
      item: "Finding-comment chat",
      tracking: "ADR 0076",
      ownerPrompt: "LY-059",
      status: "not-shipped",
      notes: "Disposition is the collab primitive — no chat thread.",
    },
    {
      item: "Lengthen 300s undo toast",
      tracking: "ADR 0071",
      ownerPrompt: "LY-043",
      status: "not-shipped",
      notes: "MUTATION_UNDO_WINDOW_SECONDS stays 300.",
    },
    {
      item: "Per-snapshot Unchecked-row judge cap",
      tracking: "LY-016 leftover",
      ownerPrompt: "LY-016",
      status: "deferred",
      notes: "Completions reuse IAgentTierCompletionRouter. No separate judge wallet.",
    },
    {
      item: "Tenant finding-engine-controls key for finalize judge",
      tracking: "LY-013",
      ownerPrompt: "LY-013",
      status: "not-shipped",
      notes: "Host JSON EnableLlmJudgeOnFinalize=false is the opt-out.",
    },
  ];
