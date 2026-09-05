/** Top-bar analysis mode labels — avoid passive status chips and model-runtime naming on buyer shells. */
export const ANALYSIS_MODE_RULE_BASED_LABEL = "Rule-based analysis";

export const ANALYSIS_MODE_WORKSPACE_LABEL = "Workspace analysis";

export const ANALYSIS_MODE_RULE_BASED_SWITCH_TITLE = "Switch to rule-based analysis?";

export const ANALYSIS_MODE_WORKSPACE_SWITCH_TITLE = "Switch to workspace analysis?";

export const ANALYSIS_MODE_RULE_BASED_SWITCH_PROMPT =
  "Rule-based analysis uses deterministic checks only. Use this for demos and offline rehearsal.";

export const ANALYSIS_MODE_WORKSPACE_SWITCH_PROMPT =
  "Workspace analysis uses your tenant-configured AI path. Confirm before changing how reviews run in this session.";

export function resolveAnalysisModeTopBarButtonLabel(isSimulator: boolean, notReady: boolean): string {
  if (isSimulator) {
    return `Analysis: ${ANALYSIS_MODE_RULE_BASED_LABEL}`;
  }

  if (notReady) {
    return "Analysis: Workspace (not ready)";
  }

  return `Analysis: ${ANALYSIS_MODE_WORKSPACE_LABEL}`;
}

/** @deprecated Dev-only — prefer analysis mode button labels. */
export const SIMULATOR_MODE_TOP_BAR_CHIP_LABEL = "Rule-based";

export const SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL =
  "AI operations use rule-based analysis, not a live model. Click to switch to live AI mode.";

/** Top-bar chip when dev override flips execution to live Azure OpenAI — quieter than rule-based mode. */
export const REAL_MODE_TOP_BAR_CHIP_LABEL = "Live AI";

export const REAL_MODE_TOP_BAR_CHIP_DETAIL =
  "AI operations use the live Azure OpenAI path. Click to switch back to rule-based analysis.";

export const REAL_MODE_AI_READINESS_OK_TITLE = "Live AI checked — OK";

export const REAL_MODE_AI_READINESS_OK_DETAIL =
  "The live Azure OpenAI probe succeeded for this session. Expand probe details below for deployment and check metadata.";

export const REAL_MODE_AI_READINESS_BLOCKED_TITLE = "Live AI selected — connection is not ready";

export const REAL_MODE_AI_READINESS_BLOCKED_DETAIL =
  "This session is set to live AI mode, but Azure OpenAI is not configured or reachable on this host. Switch the top-bar chip back to rule-based analysis, or configure AzureOpenAI credentials for local development.";

export const REAL_MODE_DEV_OVERRIDE_HOST_MISMATCH_DETAIL =
  "This browser session overrides the API host ({hostMode}) to {sessionMode}. Reviews execute using the session mode, not the host configuration alone.";

export const REAL_MODE_TOP_BAR_CHIP_NOT_READY_DETAIL =
  "Live AI mode is selected, but the connection is not ready. Check AI availability or switch back to rule-based analysis.";

/** Shown immediately after an AI operation completes while rule-based analysis is active. */
export const SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE = "Rule-based analysis — not live AI output";

export const SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY =
  "This result was produced by rule-based analysis. Treat findings and rewrites as rehearsal only until you switch to live AI mode.";
