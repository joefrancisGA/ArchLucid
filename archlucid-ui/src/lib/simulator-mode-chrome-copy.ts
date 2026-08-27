/** Top-bar chip — intentionally loud so simulator deployments cannot be mistaken for live AI. */
export const SIMULATOR_MODE_TOP_BAR_CHIP_LABEL = "SIMULATOR";

export const SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL =
  "AI operations use rule-based analysis, not a live model. Click to switch to Real mode.";

/** Top-bar chip when dev override flips execution to live Azure OpenAI — quieter than SIMULATOR. */
export const REAL_MODE_TOP_BAR_CHIP_LABEL = "REAL";

export const REAL_MODE_TOP_BAR_CHIP_DETAIL =
  "AI operations use the live Azure OpenAI path. Click to switch back to Simulator mode.";

/** Shown immediately after an AI operation completes while simulator mode is active. */
export const SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE = "Simulator mode — not live AI output";

export const SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY =
  "This result was produced by rule-based analysis in simulator mode. Treat findings and rewrites as rehearsal only until you switch to Real mode.";
