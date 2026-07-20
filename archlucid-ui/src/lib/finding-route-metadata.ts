import type { Metadata } from "next";

import { findingDetailHeadingTitle } from "@/lib/finding-display-from-inspect";
import {
  loadFindingInspectForRoute,
  shouldTreatFindingInspectFailureAsNotFound,
} from "@/lib/load-finding-inspect-for-route";
import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

/**
 * Document titles for finding routes — aligns browser chrome with on-page hero (buyer demos often tab-switch).
 */
export async function metadataForFindingDetailRoute(runId: string, findingIdEncoded: string): Promise<Metadata> {
  const findingId = decodeURIComponent(findingIdEncoded);

  if (isInvalidGuidOrSlugRouteToken(runId) || isInvalidDynamicRouteToken(findingId)) {
    return { title: "Finding detail" };
  }

  const { payload, failure, invalidRouteAlignment } = await loadFindingInspectForRoute(runId, findingId);

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

  const { failure, invalidRouteAlignment } = await loadFindingInspectForRoute(runId, findingId);

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(failure)) {
    return { title: "Evidence Trace" };
  }

  return { title: "Evidence Trace" };
}

/** @deprecated Use {@link metadataForFindingEvidenceTraceRoute}. */
export async function metadataForFindingInspectRoute(runId: string, findingIdEncoded: string): Promise<Metadata> {
  return metadataForFindingEvidenceTraceRoute(runId, findingIdEncoded);
}
