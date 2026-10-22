import type { ResolvedBuyerGoldenJourneyNav } from "@/lib/buyer/buyer-golden-journey-nav";
import { pathMatchesSignedRecordsDetailRoute, SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type BuyerOperateBackLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Paths that previously showed multi-segment shell breadcrumbs for real hierarchy.
 * After TB-2090, left-nav + page-local back links own that orientation — not a fixed showcase package link.
 */
export function isDeepHierarchyRouteWithoutShowcaseBackLink(pathnameWithSearch: string): boolean {
  const path = (pathnameWithSearch.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";

  if (/^\/governance\/approval-requests\/[^/]+/.test(path)) {
    return true;
  }

  if (/^\/governance\/policy-packs\/[^/]+/.test(path)) {
    return true;
  }

  if (/^\/showcase\/[^/]+/.test(path)) {
    return true;
  }

  return false;
}

/**
 * Buyer-polished shell: contextual return link from golden-path satellite routes to the canonical showcase package.
 */
export function buyerPolishedOperateBackLink(pathnameWithSearch: string): BuyerOperateBackLink | null {
  const path = (pathnameWithSearch.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";
  const packageHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

  if (path === "/" || path.startsWith(`${packageHref}/`) || path === packageHref) {
    return null;
  }

  if (isDeepHierarchyRouteWithoutShowcaseBackLink(path)) {
    return null;
  }

  if (path === SIGNED_RECORDS_LIST_PATH) {
    return null;
  }

  if (
    path.startsWith("/insights/evidence-graph") ||
    path.startsWith("/governance") ||
    path.startsWith("/audit") ||
    pathMatchesSignedRecordsDetailRoute(path) ||
    path.startsWith("/insights/ask-review-questions")
  ) {
    return { label: "Back to review", href: packageHref };
  }

  return null;
}

/**
 * TB-2090: shell breadcrumbs removed — show operate back links when the golden-journey stepper
 * is not already orienting the route, skip deep hierarchy routes, and skip links that only restate the scoped `runId`.
 */
export function resolveBuyerOperateBackLink(options: {
  readonly pathnameWithSearch: string;
  readonly searchRunId: string;
  readonly buyerGoldenJourneyNav: ResolvedBuyerGoldenJourneyNav | null;
}): BuyerOperateBackLink | null {
  if (options.buyerGoldenJourneyNav !== null) {
    return null;
  }

  if (isDeepHierarchyRouteWithoutShowcaseBackLink(options.pathnameWithSearch)) {
    return null;
  }

  const backLink = buyerPolishedOperateBackLink(options.pathnameWithSearch);

  if (backLink === null) {
    return null;
  }

  if (isBuyerOperateBackLinkRedundantWithScopedRun(options.searchRunId, backLink)) {
    return null;
  }

  return backLink;
}

export function isBuyerOperateBackLinkRedundantWithScopedRun(
  queryRunId: string,
  backLink: BuyerOperateBackLink,
): boolean {
  const trimmedRunId = queryRunId.trim();

  if (trimmedRunId.length === 0) {
    return false;
  }

  return backLink.href === `/architecture/reviews/${encodeURIComponent(trimmedRunId)}`;
}
