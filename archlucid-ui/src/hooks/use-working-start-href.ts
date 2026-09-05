"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { architectureDraftHasLinkedReview } from "@/lib/architecture/architecture-draft-handoff-gate";
import { resolveContinueLastArchitectureDraftEntry } from "@/lib/architecture-draft-continue-last";
import { resolveContinueLastReviewPackageTarget } from "@/lib/resolve-continue-last-review-package";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { resolveWorkingStartHref } from "@/lib/working-start-route";
import type { RunSummary } from "@/types/authority";

function subscribeInFlight(onStoreChange: () => void): () => void {
  return subscribeInFlightOperations(onStoreChange);
}

function resolveActiveInFlightReviewId(operations: readonly TrackedInFlightOperation[]): string | null {
  for (const operation of operations) {
    if (operation.state !== "Pending" && operation.state !== "Running") {
      continue;
    }

    const runId = operation.runId?.trim() ?? "";

    if (runId.length > 0) {
      return runId;
    }
  }

  return null;
}

function getActiveInFlightReviewIdSnapshot(): string | null {
  return resolveActiveInFlightReviewId(getInFlightOperations());
}

/** Client hook — resolves Working Start / Alt+N href from desk state (IS-03). */
export function useWorkingStartHref(runs: readonly RunSummary[] = []): string {
  const drafts = useArchitectureDraftRegistryEntries();
  const inFlightReviewId = useSyncExternalStore(
    subscribeInFlight,
    getActiveInFlightReviewIdSnapshot,
    getActiveInFlightReviewIdSnapshot,
  );

  return useMemo(() => {
    const continueLastReview = resolveContinueLastReviewPackageTarget(runs);
    const continueLastDraft = resolveContinueLastArchitectureDraftEntry(drafts);
    const spawnLockedReviewId =
      continueLastDraft !== null && architectureDraftHasLinkedReview(continueLastDraft)
        ? continueLastDraft.linkedReviewId?.trim() ?? null
        : null;

    return resolveWorkingStartHref({
      inFlightReviewId,
      lastOpenReviewId: continueLastReview?.runId ?? null,
      lastOpenDraftId: continueLastDraft?.architectureId ?? null,
      spawnLockedReviewId,
    }).href;
  }, [drafts, inFlightReviewId, runs]);
}
