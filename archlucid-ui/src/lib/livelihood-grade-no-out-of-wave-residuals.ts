/** Relative to repository root (parent of archlucid-ui). */
export const LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUALS.md" as const;

export type LivelihoodGradeNoOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type LivelihoodGradeNoOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: LivelihoodGradeNoOutOfWaveResidualStatus;
  readonly notes: string;
};

/** LN-025+ — explicit skips for LN-040 close audit. */
export const LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUAL_ROWS: readonly LivelihoodGradeNoOutOfWaveResidualRow[] =
  [
    {
      item: "LLM semantic judge default-on",
      tracking: "ADR 0085 / TB-1228",
      ownerPrompt: "LN-025",
      status: "not-shipped",
      notes: "Unchecked warn on finalize (LN-008) is not default-on judge. Do not flip PilotStrict hold by default.",
    },
    {
      item: "G-REAL-06 live packets / host Mode flip",
      tracking: "GTM",
      ownerPrompt: "LN-026",
      status: "not-shipped",
      notes: "Gate 1 UNKNOWN honesty (LN-012) is copy only — no fake estate runs or Simulator→Real default.",
    },
    {
      item: "ADR 0070 density predicate rewrite",
      tracking: "DX backlog",
      ownerPrompt: "LN-035",
      status: "not-shipped",
      notes: "WouldDemoteIfUnprotected copy only (LN-007). Do not change typed-engine-protected demotion predicate.",
    },
  ];
