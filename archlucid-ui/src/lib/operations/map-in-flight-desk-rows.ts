import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import { resolveArchitectureReviewTabHref } from "@/lib/architecture/working-architecture-review-routes";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { isTerminalOperationState, type OperationState } from "@/lib/operations/operation-state";

/** Honest desk copy — analysis is running; the package is not ready to seal. */
export const IN_FLIGHT_DESK_ANALYSIS_RUNNING_DETAIL =
  "Analysis is running. Continue on Activity for named stages — not ready to seal yet.";

export type InFlightDeskRow = {
  readonly operationId: string;
  readonly title: string;
  readonly stepLabel: string;
  readonly state: OperationState;
  readonly href: string;
  readonly statusLabel: string;
  readonly detailLine: string;
};

/** Rows shown on Overview / reviews hub desks (active ops + retain-until-consumed). */
export function isVisibleInFlightDeskOperation(operation: TrackedInFlightOperation): boolean {
  return !isTerminalOperationState(operation.state) || operation.retainUntilConsumed;
}

/**
 * Deep link for in-flight review analysis — Activity tab while the pipeline runs.
 * Non-review operations keep their registered href.
 */
export function buildInFlightDeskHref(operation: TrackedInFlightOperation): string {
  const runId = operation.runId?.trim() ?? "";
  const architectureId = operation.architectureId?.trim() ?? "";

  if (runId.length > 0 && architectureId.length > 0) {
    return resolveArchitectureReviewTabHref(runId, "activity", architectureId);
  }

  if (runId.length > 0) {
    return buildReviewWorkspaceTabHref(runId, "activity");
  }

  return operation.href;
}

export function mapInFlightOperationToDeskRow(operation: TrackedInFlightOperation): InFlightDeskRow {
  const stepLabel = operation.stepLabel.trim().length > 0 ? operation.stepLabel.trim() : operation.state;

  return {
    operationId: operation.operationId,
    title: operation.title,
    stepLabel,
    state: operation.state,
    href: buildInFlightDeskHref(operation),
    statusLabel: stepLabel,
    detailLine: IN_FLIGHT_DESK_ANALYSIS_RUNNING_DETAIL,
  };
}

export function mapInFlightOperationsToDeskRows(
  operations: readonly TrackedInFlightOperation[],
): readonly InFlightDeskRow[] {
  return operations.filter(isVisibleInFlightDeskOperation).map(mapInFlightOperationToDeskRow);
}

/** In-flight operations parented under one architecture identity desk (AO-21). */
export function filterInFlightOperationsForArchitecture(
  operations: readonly TrackedInFlightOperation[],
  architectureId: string,
): readonly TrackedInFlightOperation[] {
  const expected = architectureId.trim();

  if (expected.length === 0) {
    return [];
  }

  return operations.filter((operation) => {
    if (!isVisibleInFlightDeskOperation(operation)) {
      return false;
    }

    const parentArchitectureId = operation.architectureId?.trim() ?? "";

    return parentArchitectureId.length > 0 && parentArchitectureId === expected;
  });
}

/** Active review run ids from the shell in-flight store (for hub inventory ordering). */
export function collectInFlightReviewRunIds(
  operations: readonly TrackedInFlightOperation[],
): ReadonlySet<string> {
  const runIds = new Set<string>();

  for (const operation of operations) {
    if (!isVisibleInFlightDeskOperation(operation)) {
      continue;
    }

    const runId = operation.runId?.trim() ?? "";

    if (runId.length > 0) {
      runIds.add(runId);
    }
  }

  return runIds;
}
