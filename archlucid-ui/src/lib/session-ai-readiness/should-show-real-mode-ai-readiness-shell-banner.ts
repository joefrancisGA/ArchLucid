import type { WorkspaceAiAvailabilityCheckState } from "@/hooks/useWorkspaceAiAvailabilityCheck";

/**
 * True when the live AI probe has finished and failed.
 * Idle/loading is a background check — do not treat it as a user-facing failure.
 */
export function isLiveAiAvailabilityProbeFailed(
  probeState: WorkspaceAiAvailabilityCheckState,
): boolean {
  switch (probeState.status) {
    case "error":
      return true;
    case "loaded":
      return !probeState.result.isAvailable;
    case "idle":
    case "loading":
      return false;
    default: {
      const exhaustive: never = probeState;

      return exhaustive;
    }
  }
}

/**
 * Home/shell warning for Live AI. The probe runs silently until it fails;
 * after a failure the banner stays up during a retry so the page does not flash.
 */
export function shouldShowRealModeAiReadinessShellBanner(input: {
  readonly isSessionReal: boolean;
  readonly isReady: boolean;
  readonly probeState: WorkspaceAiAvailabilityCheckState;
  readonly hasAnnouncedFailure: boolean;
}): boolean {
  if (!input.isSessionReal || input.isReady) {
    return false;
  }

  if (input.hasAnnouncedFailure) {
    return true;
  }

  return isLiveAiAvailabilityProbeFailed(input.probeState);
}
