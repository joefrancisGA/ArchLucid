/**
 * Pipeline status label dictionaries (TB-651) — kept in a dependency-free leaf module so the
 * resolver and badge components never depend on `@/lib/i18n` module-evaluation order. A prior
 * regression surfaced `PIPELINE_STATUS_LABELS` as `undefined` at runtime when the binding was
 * used in both type and value position across module boundaries under Turbopack.
 * `@/lib/i18n` re-exports these for existing consumers.
 */
export const PIPELINE_STATUS_LABELS = {
  finalized: "Finalized",
  readyToFinalize: "Ready to finalize",
  inPipeline: "In pipeline",
  starting: "Starting",
  failed: "Failed",
  partiallyFailed: "Partially failed",
} as const;

/** Canonical buyer-facing pipeline status pills when vocabulary pass is active (TB-651 / UI_DESIGN_SYSTEM). */
export const PIPELINE_STATUS_BUYER_DISPLAY_LABELS = {
  finalized: "Ready",
  readyToFinalize: "Needs attention",
  inPipeline: "In progress",
  starting: "Starting",
  failed: "Stopped",
  partiallyFailed: "Incomplete",
} as const;

/** Internal pipeline labels derived from {@link RunSummary} snapshot flags. */
export type RunPipelineInternalLabel =
  (typeof PIPELINE_STATUS_LABELS)[keyof typeof PIPELINE_STATUS_LABELS];

/**
 * Total internal→buyer label mapping — `Record<RunPipelineInternalLabel, string>` keeps this
 * exhaustive at compile time when a new pipeline status is added.
 */
export const PIPELINE_STATUS_BUYER_LABEL_BY_INTERNAL: Record<RunPipelineInternalLabel, string> = {
  [PIPELINE_STATUS_LABELS.finalized]: PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized,
  [PIPELINE_STATUS_LABELS.readyToFinalize]: PIPELINE_STATUS_BUYER_DISPLAY_LABELS.readyToFinalize,
  [PIPELINE_STATUS_LABELS.inPipeline]: PIPELINE_STATUS_BUYER_DISPLAY_LABELS.inPipeline,
  [PIPELINE_STATUS_LABELS.starting]: PIPELINE_STATUS_BUYER_DISPLAY_LABELS.starting,
  [PIPELINE_STATUS_LABELS.failed]: PIPELINE_STATUS_BUYER_DISPLAY_LABELS.failed,
  [PIPELINE_STATUS_LABELS.partiallyFailed]: PIPELINE_STATUS_BUYER_DISPLAY_LABELS.partiallyFailed,
};
