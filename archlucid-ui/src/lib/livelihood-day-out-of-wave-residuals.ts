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

/** LY-043 / 046 / 058 / 059 / 071 / 089 / 090 / 116–118 skips plus LY-042 / 093 deferred. */
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
      item: "Compare architecture drafts",
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
    {
      item: "Cross-refresh draft undo",
      tracking: "ADR 0071 / LY-041",
      ownerPrompt: "LY-042",
      status: "deferred",
      notes: "In-tab stacks only. Do not fake with sessionStorage as undo SoT. Prefer existing CAS/history if a later prompt implements it.",
    },
    {
      item: "General server undo log for sealed records",
      tracking: "ADR 0039",
      ownerPrompt: "LY-044",
      status: "not-shipped",
      notes: "Sealed records stay immutable. Architecture-architecture-draft-only undo stays in-tab.",
    },
    {
      item: "Uncited-hard leftover (LN-025 residual)",
      tracking: "LN-025",
      ownerPrompt: "LY-071",
      status: "not-shipped",
      notes: "Do not re-run LN uncited-hard. Residual stays not-shipped.",
    },
    {
      item: "Extraction provenance leftover (LN)",
      tracking: "LN leftover",
      ownerPrompt: "LY-089",
      status: "not-shipped",
      notes: "Do not re-run LN extraction provenance. No 40th engine.",
    },
    {
      item: "Adversarial/eval band named leftover (LN)",
      tracking: "LN leftover",
      ownerPrompt: "LY-090",
      status: "not-shipped",
      notes: "Do not let 0099 Supported wash eval rows into Career Supported.",
    },
    {
      item: "Recents/pins server sync",
      tracking: "SG-088 leftover",
      ownerPrompt: "LY-093",
      status: "deferred",
      notes: "Operator recents remain localStorage. Not sessionStorage SoT. No new recents kernel.",
    },
  ];
