"use client";

import { useMemo, useSyncExternalStore } from "react";

import { findInFlightOperationForRun } from "@/lib/operations/find-in-flight-operation-for-run";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";

/**
 * Reads the shared shell in-flight store for one review pipeline operation (TB-2077).
 */
export function useReviewPipelineInFlightForRun(
  runId: string,
): TrackedInFlightOperation | null {
  const operations = useSyncExternalStore(
    subscribeInFlightOperations,
    getInFlightOperations,
    getInFlightOperations,
  );

  return useMemo(() => findInFlightOperationForRun(operations, runId), [operations, runId]);
}
