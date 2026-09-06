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

export function advisoryDraftDetailHref(draftId: string): string {
  const trimmed = draftId.trim();

  if (trimmed.length === 0 || trimmed === ARCHITECTURE_NEW_DRAFT_SEGMENT) {
    return ARCHITECTURES_NEW_PATH;
  }

  return architectureDraftPath(trimmed);
}

export type TrackAdvisoryDraftInFlightInput = {
  readonly operationId: string;
  readonly draftId?: string | null;
  /** dbo.Architectures.ArchitectureId when known — never substitute draftId (PC-07). */
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

  const draftId = input.draftId?.trim() || ARCHITECTURE_NEW_DRAFT_SEGMENT;
  const architectureId = input.architectureId?.trim() ?? null;

  trackInFlightOperation({
    operationId,
    title: ADVISORY_DRAFT_IN_FLIGHT_TITLE,
    href: advisoryDraftDetailHref(draftId),
    architectureId: architectureId !== null && architectureId.length > 0 ? architectureId : null,
    runId: null,
    stepLabel: "Queued",
    state: "Pending",
    retainUntilConsumed: true,
  });

  return operationId;
}

export function findTrackedAdvisoryDraftForArchitecture(
  draftId: string,
): TrackedInFlightOperation | null {
  const href = advisoryDraftDetailHref(draftId);
  const matches = getInFlightOperations().filter((row) => {
    if (!isAdvisoryDraftOperationId(row.operationId)) {
      return false;
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
  fromDraftId: string,
  toDraftId: string,
): void {
  const fromHref = advisoryDraftDetailHref(fromDraftId);
  const toTrimmed = toDraftId.trim();

  if (toTrimmed.length === 0) {
    return;
  }

  const toHref = advisoryDraftDetailHref(toTrimmed);

  for (const row of getInFlightOperations()) {
    if (!isAdvisoryDraftOperationId(row.operationId)) {
      continue;
    }

    if (row.href !== fromHref) {
      continue;
    }

    patchInFlightOperation(row.operationId, {
      href: toHref,
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
