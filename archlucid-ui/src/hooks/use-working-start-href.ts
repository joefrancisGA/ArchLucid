"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { architectureDraftHasLinkedReview } from "@/lib/architecture/architecture-draft-handoff-gate";
import { resolveContinueLastArchitectureDraftEntry } from "@/lib/architecture-draft-continue-last";
import { getUserPreferences, readCachedUserPreferencesForMutators } from "@/lib/api/user-preferences";
import { defaultDeskContinuityDto, type DeskContinuityDto } from "@/lib/api/user-preferences-types";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
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

function resolveDeskContinuityFromPreferences(): DeskContinuityDto {
  const prefs = readCachedUserPreferencesForMutators();

  if (!prefs.deskContinuityIsExplicit) {
    return readCachedDeskContinuity();
  }

  return mergeDeskContinuity(defaultDeskContinuityDto(), prefs.deskContinuity);
}

/** Client hook — resolves Working Start / Alt+N href from desk state (IS-03 / IS-13). */
export function useWorkingStartHref(runs: readonly RunSummary[] = []): string {
  const drafts = useArchitectureDraftRegistryEntries();
  const [deskContinuity, setDeskContinuity] = useState<DeskContinuityDto>(() => resolveDeskContinuityFromPreferences());
  const inFlightReviewId = useSyncExternalStore(
    subscribeInFlight,
    getActiveInFlightReviewIdSnapshot,
    getActiveInFlightReviewIdSnapshot,
  );

  useEffect(() => {
    void getUserPreferences()
      .then((prefs) => {
        if (!prefs.deskContinuityIsExplicit) {
          return;
        }

        setDeskContinuity(mergeDeskContinuity(defaultDeskContinuityDto(), prefs.deskContinuity));
      })
      .catch(() => {
        /* offline */
      });
  }, []);

  return useMemo(() => {
    const continueLastReview = resolveContinueLastReviewPackageTarget(
      runs,
      deskContinuity.lastOpenReviewId,
    );
    const continueLastDraft = resolveContinueLastArchitectureDraftEntry(
      drafts,
      deskContinuity.lastOpenDraftId,
    );
    const spawnLockedReviewId =
      continueLastDraft !== null && architectureDraftHasLinkedReview(continueLastDraft)
        ? continueLastDraft.linkedReviewId?.trim() ?? null
        : null;

    return resolveWorkingStartHref({
      inFlightReviewId,
      lastOpenReviewId: continueLastReview?.runId ?? null,
      lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
      lastOpenDraftId: continueLastDraft?.draftId ?? null,
      spawnLockedReviewId,
    }).href;
  }, [deskContinuity.lastOpenDraftId, deskContinuity.lastOpenReviewId, drafts, inFlightReviewId, runs]);
}
