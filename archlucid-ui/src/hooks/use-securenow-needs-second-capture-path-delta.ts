"use client";

import { useSecureNowSuccessfulCaptureCount } from "@/hooks/use-securenow-successful-capture-count";

/** True when exactly one successful capture exists — path-id deltas need a second capture. */
export function useSecureNowNeedsSecondCapturePathDelta(enabled: boolean): boolean {
  const successfulCaptureCount = useSecureNowSuccessfulCaptureCount(enabled);

  if (successfulCaptureCount === null) {
    return false;
  }

  return successfulCaptureCount === 1;
}
