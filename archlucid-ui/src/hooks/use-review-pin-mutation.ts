"use client";

import { useCallback, useState } from "react";

import { pinArchitectureRun } from "@/lib/api/architecture-runs-lifecycle";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { reviewPinMutationBlockedReason } from "@/lib/runs/review-pin-mutation-blocked-reason";
import { showError } from "@/lib/toast";

/** Server pin mutation with fail-closed sealed-manifest 409 copy (wave-71 control 843). */
export function useReviewPinMutation(): {
  readonly pinBusyRunId: string | null;
  readonly setRunPinned: (runId: string, isPinned: boolean) => Promise<boolean>;
} {
  const [pinBusyRunId, setPinBusyRunId] = useState<string | null>(null);

  const setRunPinned = useCallback(async (runId: string, isPinned: boolean): Promise<boolean> => {
    setPinBusyRunId(runId);

    try {
      await pinArchitectureRun(runId, { isPinned });

      return true;
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      showError(reviewPinMutationBlockedReason(failure) ?? failure.message);

      return false;
    } finally {
      setPinBusyRunId(null);
    }
  }, []);

  return { pinBusyRunId, setRunPinned };
}
