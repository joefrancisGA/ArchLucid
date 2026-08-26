import {
  ARCHITECTURE_NEW_DRAFT_SEGMENT,
  ARCHITECTURES_NEW_PATH,
  architectureDraftPath,
} from "@/lib/architecture/architecture-routes";
import {
  getInFlightOperations,
  patchInFlightOperation,
  removeInFlightOperation,
  trackInFlightOperation,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo/eligibility";

export const ADVISORY_DRAFT_IN_FLIGHT_TITLE = "Structured brief suggestions";

export const ADVISORY_DRAFT_OPERATION_ID_PREFIX = "draft:";

export function isAdvisoryDraftOperationId(operationId: string): boolean {
  return operationId.trim().startsWith(ADVISORY_DRAFT_OPERATION_ID_PREFIX);
}

export function advisoryDraftDetailHref(architectureId: string): string {
  const trimmed = architectureId.trim();

  if (trimmed.length === 0 || trimmed === ARCHITECTURE_NEW_DRAFT_SEGMENT) {
    return ARCHITECTURES_NEW_PATH;
  }

  return architectureDraftPath(trimmed);
}

export type TrackAdvisoryDraftInFlightInput = {
  readonly operationId: string;
  readonly architectureId?: string | null;
};

/**
 * Registers Suggest from overview with the shell In progress list (TB-2077) so leaving the
 * architecture draft does not hide queued suggestion work that the server already accepted.
 */
export function trackAdvisoryDraftInFlight(
  input: TrackAdvisoryDraftInFlightInput,
): string | null {
  const operationId = input.operationId.trim();

  if (operationId.length === 0 || !isAdvisoryDraftOperationId(operationId)) {
    return null;
  }

  // Demo and presenter-offline shells have no live operations endpoint.
  if (isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const architectureId = input.architectureId?.trim() || ARCHITECTURE_NEW_DRAFT_SEGMENT;

  trackInFlightOperation({
    operationId,
    title: ADVISORY_DRAFT_IN_FLIGHT_TITLE,
    href: advisoryDraftDetailHref(architectureId),
    architectureId,
    runId: null,
    stepLabel: "Queued",
    state: "Pending",
    retainUntilConsumed: true,
  });

  return operationId;
}

export function findTrackedAdvisoryDraftForArchitecture(
  architectureId: string,
): TrackedInFlightOperation | null {
  const href = advisoryDraftDetailHref(architectureId);
  const normalizedArchitectureId = architectureId.trim() || ARCHITECTURE_NEW_DRAFT_SEGMENT;
  const matches = getInFlightOperations().filter((row) => {
    if (!isAdvisoryDraftOperationId(row.operationId)) {
      return false;
    }

    if (row.architectureId === normalizedArchitectureId) {
      return true;
    }

    return row.href === href;
  });

  if (matches.length === 0) {
    return null;
  }

  return matches.reduce((latest, row) =>
    row.startedAtMs > latest.startedAtMs ? row : latest,
  );
}

/** Keeps Open pointed at the saved draft after deferred create replaces `/architectures/new`. */
export function retargetAdvisoryDraftInFlightArchitecture(
  fromArchitectureId: string,
  toArchitectureId: string,
): void {
  const fromHref = advisoryDraftDetailHref(fromArchitectureId);
  const toTrimmed = toArchitectureId.trim();

  if (toTrimmed.length === 0) {
    return;
  }

  const toHref = advisoryDraftDetailHref(toTrimmed);

  for (const row of getInFlightOperations()) {
    if (!isAdvisoryDraftOperationId(row.operationId)) {
      continue;
    }

    const matchesFromArchitecture =
      row.architectureId === (fromArchitectureId.trim() || ARCHITECTURE_NEW_DRAFT_SEGMENT)
      || row.href === fromHref;

    if (!matchesFromArchitecture) {
      continue;
    }

    patchInFlightOperation(row.operationId, {
      href: toHref,
      architectureId: toTrimmed,
    });
  }
}

export function markAdvisoryDraftInFlightConsumed(operationId: string): void {
  const trimmed = operationId.trim();

  if (trimmed.length === 0) {
    return;
  }

  removeInFlightOperation(trimmed);
}
