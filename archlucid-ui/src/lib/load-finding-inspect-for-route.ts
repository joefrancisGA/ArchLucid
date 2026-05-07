import { getFindingInspect } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { tryStaticDemoFindingInspect } from "@/lib/operator-static-demo";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type LoadFindingInspectForRouteResult = {
  payload: FindingInspectPayload | null;
  failure: ApiLoadFailureState | null;
  /**
   * Inspect returned a payload that did not match the route tokens and no curated demo payload applies — treat like
   * `notFound()` at the route entry.
   */
  invalidRouteAlignment: boolean;
};

export function normalizeFindingInspectRecommendedActions(payload: FindingInspectPayload): FindingInspectPayload {
  return {
    ...payload,
    recommendedActions: payload.recommendedActions ?? [],
  };
}

/** Authority run IDs from URL vs API (hyphenated vs GUID “N”, case). */
function authorityRunIdsAlignForInspectRoute(urlRunId: string, payloadRunId: string): boolean {
  const norm = (s: string): string => s.replace(/-/g, "").toLowerCase();

  return norm(String(urlRunId)) === norm(String(payloadRunId));
}

/** Finding id in the URL must match the inspect document’s `findingId` (case-insensitive). */
export function findingIdsAlignForInspectRoute(urlFindingId: string, payloadFindingId: string): boolean {
  return String(urlFindingId).trim().toLowerCase() === String(payloadFindingId).trim().toLowerCase();
}

/**
 * Loads inspect data for `/reviews/.../findings/...` family routes: network errors fall back to curated demo when
 * eligible; successful responses that disagree with the URL prefer demo when available, else {@link invalidRouteAlignment}.
 */
export async function loadFindingInspectForRoute(
  runId: string,
  decodedFindingId: string,
): Promise<LoadFindingInspectForRouteResult> {
  let payload: FindingInspectPayload | null = null;
  let failure: ApiLoadFailureState | null = null;

  try {
    payload = await getFindingInspect(runId, decodedFindingId);
  } catch (e) {
    failure = toApiLoadFailure(e);
  }

  const staticInspect = tryStaticDemoFindingInspect(runId, decodedFindingId);

  if (failure !== null && staticInspect !== null) {
    return {
      payload: normalizeFindingInspectRecommendedActions(staticInspect),
      failure: null,
      invalidRouteAlignment: false,
    };
  }

  if (failure !== null) {
    return { payload: null, failure, invalidRouteAlignment: false };
  }

  if (payload === null) {

    if (staticInspect !== null) {
      return {
        payload: normalizeFindingInspectRecommendedActions(staticInspect),
        failure: null,
        invalidRouteAlignment: false,
      };
    }

    return { payload: null, failure: null, invalidRouteAlignment: false };
  }

  const effective = normalizeFindingInspectRecommendedActions(payload);
  const runOk = authorityRunIdsAlignForInspectRoute(runId, effective.runId);
  const findingOk = findingIdsAlignForInspectRoute(decodedFindingId, effective.findingId);

  if (!runOk || !findingOk) {

    if (staticInspect !== null) {
      return {
        payload: normalizeFindingInspectRecommendedActions(staticInspect),
        failure: null,
        invalidRouteAlignment: false,
      };
    }

    return {
      payload: null,
      failure: null,
      invalidRouteAlignment: true,
    };
  }

  return { payload: effective, failure: null, invalidRouteAlignment: false };
}

/** When failure is absent and payload is absent, callers may still need `notFound()` for not-found-ish outcomes. */
export function shouldTreatFindingInspectFailureAsNotFound(failure: ApiLoadFailureState | null): boolean {
  if (failure === null) {
    return false;
  }

  return isApiNotFoundFailure(failure);
}
