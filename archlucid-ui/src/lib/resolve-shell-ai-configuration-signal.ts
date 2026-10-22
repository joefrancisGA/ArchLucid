import type { SessionAiReadinessState } from "@/hooks/use-session-ai-readiness-core";
import type { WorkspaceAiConfigurationSignal } from "@/lib/review-failure-recovery-role-copy";
import { REAL_MODE_DEV_OVERRIDE_HOST_MISMATCH_DETAIL } from "@/lib/simulator-mode-chrome-copy";

/** Workspace AI signal copy for the architect workspace Live AI readiness panel. */
export function resolveShellAiConfigurationSignal(
  readiness: SessionAiReadinessState,
): WorkspaceAiConfigurationSignal {
  if (
    readiness.hasDevOverride
    && readiness.hostMode !== null
    && readiness.sessionMode !== null
    && readiness.hostMode !== readiness.sessionMode
  ) {
    const mismatchDetail = REAL_MODE_DEV_OVERRIDE_HOST_MISMATCH_DETAIL.replace(
      "{hostMode}",
      readiness.hostMode,
    ).replace("{sessionMode}", readiness.sessionMode);

    return {
      label: "Live AI readiness",
      detail: mismatchDetail,
    };
  }

  return {
    label: "Live AI readiness",
    detail:
      "Live AI mode is selected for this session. Availability is checked automatically while you work in the architect workspace.",
  };
}
