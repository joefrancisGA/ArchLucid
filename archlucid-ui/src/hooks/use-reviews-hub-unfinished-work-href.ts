"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { resolveReviewsHubUnfinishedWorkHref } from "@/lib/reviews-hub-unfinished-work-href";

type ActiveInFlightJob = {
  readonly architectureId: string;
  readonly runId: string | null;
};

function resolveActiveInFlightJob(
  operations: readonly TrackedInFlightOperation[],
): ActiveInFlightJob | null {
  for (const operation of operations) {
    if (operation.state !== "Pending" && operation.state !== "Running") {
      continue;
    }

    const architectureId = operation.architectureId?.trim() ?? "";

    if (architectureId.length === 0) {
      continue;
    }

    const runId = operation.runId?.trim() ?? "";

    return {
      architectureId,
      runId: runId.length > 0 ? runId : null,
    };
  }

  return null;
}

function subscribeInFlight(onStoreChange: () => void): () => void {
  return subscribeInFlightOperations(onStoreChange);
}

function getActiveInFlightJobSnapshot(): ActiveInFlightJob | null {
  return resolveActiveInFlightJob(getInFlightOperations());
}

/** Client hook — Working unfinished-work CTAs open the desk or nested job, not the hub filter (SY-54). */
export function useReviewsHubUnfinishedWorkHref(): string {
  const { isWorkingMode } = useWorkspaceMode();
  const activeInFlightJob = useSyncExternalStore(
    subscribeInFlight,
    getActiveInFlightJobSnapshot,
    getActiveInFlightJobSnapshot,
  );

  return useMemo(
    () =>
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: isWorkingMode,
        lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
        inFlightParentArchitectureId: activeInFlightJob?.architectureId ?? null,
        inFlightRunId: activeInFlightJob?.runId ?? null,
      }),
    [activeInFlightJob?.architectureId, activeInFlightJob?.runId, isWorkingMode],
  );
}
