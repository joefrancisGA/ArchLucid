"use client";

import { useMemo, useSyncExternalStore } from "react";

import { hasInFlightReviewPipeline } from "@/lib/governance/working-career-rehearsal-door-mid-review-confirm";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
} from "@/lib/operations/in-flight-operations-store";

/** Reads the shell in-flight store without starting a second poller. */
export function useHasInFlightReviewPipeline(): boolean {
  const operations = useSyncExternalStore(
    subscribeInFlightOperations,
    getInFlightOperations,
    getInFlightOperations,
  );

  return useMemo(() => hasInFlightReviewPipeline(operations), [operations]);
}
