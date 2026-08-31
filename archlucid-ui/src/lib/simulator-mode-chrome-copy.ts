/** Top-bar chip — intentionally loud so simulator deployments cannot be mistaken for live AI. */
export const SIMULATOR_MODE_TOP_BAR_CHIP_LABEL = "SIMULATOR";

export const SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL =
  "AI operations use rule-based analysis, not a live model. Click to switch to Real mode.";

/** Top-bar chip when dev override flips execution to live Azure OpenAI — quieter than SIMULATOR. */
export const REAL_MODE_TOP_BAR_CHIP_LABEL = "REAL";

export const REAL_MODE_TOP_BAR_CHIP_DETAIL =
  "AI operations use the live Azure OpenAI path. Click to switch back to Simulator mode.";

export const REAL_MODE_AI_READINESS_BLOCKED_TITLE = "Real mode selected — live AI is not ready";

export const REAL_MODE_AI_READINESS_BLOCKED_DETAIL =
  "This session is set to Real mode, but live Azure OpenAI is not configured or reachable on this host. Switch the top-bar chip back to Simulator, or configure AzureOpenAI credentials for local development.";

export const REAL_MODE_DEV_OVERRIDE_HOST_MISMATCH_DETAIL =
  "This browser session overrides the API host ({hostMode}) to {sessionMode}. Reviews execute using the session mode, not the host configuration alone.";

export const REAL_MODE_TOP_BAR_CHIP_NOT_READY_DETAIL =
  "Real mode is selected, but live AI is not ready. Check AI availability or switch back to Simulator.";

/** Shown immediately after an AI operation completes while simulator mode is active. */
export const SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE = "Simulator mode — not live AI output";

export const SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY =
  "This result was produced by rule-based analysis in simulator mode. Treat findings and rewrites as rehearsal only until you switch to Real mode.";
