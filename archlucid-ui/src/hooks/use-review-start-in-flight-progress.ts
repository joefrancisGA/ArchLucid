"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  buildLongOperationWaitCopy,
  type LongOperationWaitCopy,
} from "@/lib/operations/long-operation-wait-copy";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { REVIEW_START_WAIT_OPERATION_LABEL } from "@/lib/review-start-progress-copy";

export type ReviewStartInFlightProgress = {
  readonly operation: TrackedInFlightOperation | null;
  readonly serverStepLabel: string | null;
  readonly waitCopy: LongOperationWaitCopy | null;
  readonly isTerminal: boolean;
};

/**
 * Reads the shared shell in-flight store for one create/execute operation — no second poller (TB-2077).
 */
export function useReviewStartInFlightProgress(
  operationId: string | null | undefined,
  elapsedMs: number,
): ReviewStartInFlightProgress {
  const operations = useSyncExternalStore(
    subscribeInFlightOperations,
    getInFlightOperations,
    getInFlightOperations,
  );

  const operation = useMemo(() => {
    const trimmed = operationId?.trim() ?? "";

    if (trimmed.length === 0) {
      return null;
    }

    return operations.find((row) => row.operationId === trimmed) ?? null;
  }, [operationId, operations]);

  const serverStepLabel = operation?.stepLabel?.trim() ?? null;
  const isTerminal = operation !== null && isTerminalOperationState(operation.state);

  const waitCopy = useMemo(() => {
    if (serverStepLabel === null || serverStepLabel.length === 0) {
      return null;
    }

    return buildLongOperationWaitCopy({
      operationLabel: REVIEW_START_WAIT_OPERATION_LABEL,
      stageLabel: serverStepLabel,
      elapsedMs,
    });
  }, [elapsedMs, serverStepLabel]);

  return {
    operation,
    serverStepLabel,
    waitCopy,
    isTerminal,
  };
}
