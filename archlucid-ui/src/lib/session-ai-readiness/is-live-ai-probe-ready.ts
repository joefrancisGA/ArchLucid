import type { WorkspaceAiAvailabilityResult } from "@/lib/workspace-ai-availability";

/** True when a loaded probe result means Live AI is ready for the current session mode. */
export function isLiveAiProbeReady(
  isSessionReal: boolean,
  availability: WorkspaceAiAvailabilityResult,
): boolean {
  if (!availability.isAvailable) {
    return false;
  }

  if (!isSessionReal) {
    return true;
  }

  return availability.aiSource === "managed-platform" || availability.aiSource === "customer-connection";
}
