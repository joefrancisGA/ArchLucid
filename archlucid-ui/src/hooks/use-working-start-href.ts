"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { getUserPreferences, readCachedUserPreferencesForMutators } from "@/lib/api/user-preferences";
import { defaultDeskContinuityDto, type DeskContinuityDto } from "@/lib/api/user-preferences-types";
import {
  mergeDeskContinuity,
  readCachedDeskContinuity,
  readCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { resolveWorkingCreateStartHref } from "@/lib/system-not-job-start-review-from-desk-only-working";
import { resolveWorkingStartHref } from "@/lib/working-start-route";
import type { RunSummary } from "@/types/authority";

function resolveWorkingArchitectureContext(input: {
  readonly inFlightParentArchitectureId: string;
}): {
  readonly lastOpenArchitectureId: string | null;
  readonly inFlightParentArchitectureId: string | null;
} {
  const parentArchitectureId = input.inFlightParentArchitectureId.trim();

  return {
    lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
    inFlightParentArchitectureId: parentArchitectureId.length > 0 ? parentArchitectureId : null,
  };
}

function subscribeInFlight(onStoreChange: () => void): () => void {
  return subscribeInFlightOperations(onStoreChange);
}

function resolveActiveInFlightParentArchitectureId(
  operations: readonly TrackedInFlightOperation[],
): string | null {
  for (const operation of operations) {
    if (operation.state !== "Pending" && operation.state !== "Running") {
      continue;
    }

    const architectureId = operation.architectureId?.trim() ?? "";

    if (architectureId.length > 0) {
      return architectureId;
    }
  }

  return null;
}

function getInFlightParentArchitectureIdSnapshot(): string {
  return resolveActiveInFlightParentArchitectureId(getInFlightOperations()) ?? "";
}

function resolveDeskContinuityFromPreferences(): DeskContinuityDto {
  const prefs = readCachedUserPreferencesForMutators();

  if (!prefs.deskContinuityIsExplicit) {
    return readCachedDeskContinuity();
  }

  return mergeDeskContinuity(defaultDeskContinuityDto(), prefs.deskContinuity);
}

/** Client hook — bare `/reviews/new` redirect lands on the architecture desk (ADR 0077 / AO-15). */
export function useWorkingStartHref(_runs: readonly RunSummary[] = []): string {
  const [deskContinuity, setDeskContinuity] = useState<DeskContinuityDto>(() => resolveDeskContinuityFromPreferences());
  const inFlightParentArchitectureId = useSyncExternalStore(
    subscribeInFlight,
    getInFlightParentArchitectureIdSnapshot,
    getInFlightParentArchitectureIdSnapshot,
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
    return resolveWorkingStartHref(
      resolveWorkingArchitectureContext({ inFlightParentArchitectureId }),
    ).href;
  }, [deskContinuity.lastOpenDraftId, inFlightParentArchitectureId]);
}

/** Client hook — Working Alt+N / New review creates under the open architecture (SN-019). */
export function useWorkingCreateStartHref(_runs: readonly RunSummary[] = []): string {
  const [deskContinuity, setDeskContinuity] = useState<DeskContinuityDto>(() => resolveDeskContinuityFromPreferences());
  const inFlightParentArchitectureId = useSyncExternalStore(
    subscribeInFlight,
    getInFlightParentArchitectureIdSnapshot,
    getInFlightParentArchitectureIdSnapshot,
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
    return resolveWorkingCreateStartHref(
      resolveWorkingArchitectureContext({ inFlightParentArchitectureId }),
    ).href;
  }, [deskContinuity.lastOpenDraftId, inFlightParentArchitectureId]);
}
