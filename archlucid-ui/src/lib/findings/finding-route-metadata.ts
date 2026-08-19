import type { Metadata } from "next";

import { findingDetailHeadingTitle } from "@/lib/findings/finding-display-from-inspect";
import { shouldTreatFindingInspectFailureAsNotFound } from "@/lib/load-finding-inspect-for-route";
import { loadFindingInspectForRouteCached } from "@/lib/load-finding-inspect-for-route-cached";
import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

/**
 * Document titles for finding routes — aligns browser chrome with on-page hero (buyer demos often tab-switch).
 *
 * Uses the same cached slim inspect as the page loader (includeTypedPayload=false) so metadata does not
 * issue a second fat/LOB inspect call on first paint.
 */
export async function metadataForFindingDetailRoute(runId: string, findingIdEncoded: string): Promise<Metadata> {
  const findingId = decodeURIComponent(findingIdEncoded);

  if (isInvalidGuidOrSlugRouteToken(runId) || isInvalidDynamicRouteToken(findingId)) {
    return { title: "Finding detail" };
  }

  const { payload, failure, invalidRouteAlignment } = await loadFindingInspectForRouteCached(
    runId,
    findingId,
    false,
  );

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(failure) || payload === null) {
    return { title: "Finding detail" };
  }

  const heading = findingDetailHeadingTitle(payload);

  return { title: `${heading} · Finding` };
}

/** Evidence trace route — canonical page title for browser chrome. */
export async function metadataForFindingEvidenceTraceRoute(
  runId: string,
  findingIdEncoded: string,
): Promise<Metadata> {
  const findingId = decodeURIComponent(findingIdEncoded);

  if (isInvalidGuidOrSlugRouteToken(runId) || isInvalidDynamicRouteToken(findingId)) {
    return { title: "Evidence Trace" };
  }

  const { failure, invalidRouteAlignment } = await loadFindingInspectForRouteCached(runId, findingId, false);

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(failure)) {
    return { title: "Evidence Trace" };
  }

  return { title: "Evidence Trace" };
}

/** @deprecated Use {@link metadataForFindingEvidenceTraceRoute}. */
export async function metadataForFindingInspectRoute(runId: string, findingIdEncoded: string): Promise<Metadata> {
  return metadataForFindingEvidenceTraceRoute(runId, findingIdEncoded);
}
