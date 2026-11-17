import { parseReviewWorkspaceRouteFromHref } from "@/lib/architecture/review-workspace-route";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";

/** Upgrades flat peer review cite URLs to nested desk links when continuity is available (Ask grounding footer). */
export function resolveAskGroundingLinkHref(href: string): string {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return href;
  }

  const parsed = parseReviewWorkspaceRouteFromHref(trimmed);

  if (parsed === null || parsed.architectureId !== null) {
    return href;
  }

  const upgraded = resolveScopedInsightOpenReviewHrefWithDeskContinuity(parsed.runId, {
    primaryFindingId: parsed.findingId,
    architectureId: null,
  });

  if (upgraded === trimmed) {
    return href;
  }

  const originalUrl = new URL(trimmed, "http://archlucid.local");
  const upgradedUrl = new URL(upgraded, "http://archlucid.local");

  originalUrl.searchParams.forEach((value, key) => {
    if (!upgradedUrl.searchParams.has(key)) {
      upgradedUrl.searchParams.set(key, value);
    }
  });

  upgradedUrl.hash = originalUrl.hash;

  return `${upgradedUrl.pathname}${upgradedUrl.search}${upgradedUrl.hash}`;
}
