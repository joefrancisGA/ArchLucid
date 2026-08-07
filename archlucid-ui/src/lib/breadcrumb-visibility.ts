import type { BreadcrumbItem } from "@/lib/breadcrumb-map";
import type { ResolvedBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm-connectors-admin-scope";
import { pathMatchesIntegrationsReadiness } from "@/lib/integrations-nav-paths";

export type ShouldShowBreadcrumbTrailOptions = {
  /** Active review package when a hub route is scoped with `?runId=`. */
  readonly queryRunId?: string;
  /** Persisted reviews list URL (filters) — sidebar only links to the default list. */
  readonly reviewsListReturnHref?: string;
  /** Buyer-polished golden journey stepper — replaces global shell breadcrumbs on the curated spine. */
  readonly buyerGoldenJourneyNav?: ResolvedBuyerGoldenJourneyNav | null;
};

function normalizePathname(pathname: string): string {
  const withLeadingSlash = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;

  return withLeadingSlash.replace(/\/$/, "") || "/";
}

function hasRunScopedReviewParentCrumb(items: readonly BreadcrumbItem[], queryRunId?: string): boolean {
  const runId = queryRunId?.trim() ?? "";

  if (runId.length === 0) {
    return false;
  }

  const reviewHref = `/architecture/reviews/${encodeURIComponent(runId)}`;

  return items[0]?.href === reviewHref;
}

function hasCustomReviewsListReturnHref(reviewsListReturnHref?: string): boolean {
  if (reviewsListReturnHref === undefined || reviewsListReturnHref.trim().length === 0) {
    return false;
  }

  return reviewsListReturnHref.trim() !== "/architecture/reviews";
}

function isHelpTopicPath(normalizedPath: string): boolean {
  return normalizedPath === "/help" || normalizedPath.startsWith("/help/");
}

/**
 * Routes whose logical parent differs from the URL prefix — sidebar highlight alone does not orient cold landings.
 */
function isCrossNamespaceOrientationPath(normalizedPath: string): boolean {
  if (normalizedPath === "/audit" || normalizedPath.startsWith("/audit/")) {
    return true;
  }

  if (normalizedPath.startsWith("/administration/")) {
    return true;
  }

  if (normalizedPath.startsWith("/internal/")) {
    return true;
  }

  if (normalizedPath === ITSM_CONNECTORS_ADMIN_PATH) {
    return true;
  }

  if (pathMatchesIntegrationsReadiness(normalizedPath)) {
    return true;
  }

  return false;
}

/** Page views that render their own breadcrumb wayfinding — suppress duplicate shell chrome. */
export function hasPageLocalBreadcrumbWayfinding(pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname);

  if (/^\/architecture\/reviews\/[^/]+\/findings\/[^/]+/.test(normalizedPath)) {
    return true;
  }

  if (/^\/signed-records\/[^/]+$/.test(normalizedPath)) {
    return true;
  }

  if (/^\/manifests\/[^/]+$/.test(normalizedPath)) {
    return true;
  }

  return false;
}

function isDetailPagePath(normalizedPath: string): boolean {
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length < 2) {
    return false;
  }

  // Canonical review detail lives under `/architecture/reviews/{id}` — treat the same as bare `/reviews/{id}`.
  if (segments[0] === "architecture" && segments[1] === "reviews") {
    const reviewId = segments[2] ?? "";

    return reviewId.length > 0 && reviewId !== "new" && segments.length === 3;
  }

  // Canonical architecture draft detail/new lives under `/architecture/architectures/{id|new}`.
  if (segments[0] === "architecture" && segments[1] === "architectures") {
    const architectureSegment = segments[2] ?? "";

    return architectureSegment.length > 0;
  }

  const root = segments[0] ?? "";
  const second = segments[1] ?? "";
  const rest = segments.slice(2);

  if (root === "reviews" && second !== "new" && rest.length === 0) {
    return true;
  }

  if ((root === "signed-records" || root === "manifests") && second.length > 0) {
    return true;
  }

  if (root === "governance" && second === "policy-packs" && rest.length > 0) {
    return true;
  }

  if (root === "governance" && second === "approval-requests" && rest.length > 0) {
    return true;
  }

  if (root === "showcase" && second.length > 0) {
    return true;
  }

  if (root === "architectures" && second.length > 0) {
    return true;
  }

  return false;
}

/**
 * Global shell breadcrumbs render only when the trail adds navigation value beyond sidebar active state.
 * Shallow hub/list routes (depth-two trails that mirror nav) stay hidden; detail, help, cross-namespace,
 * run-scoped, and deep trails remain visible.
 */
export function shouldShowBreadcrumbTrail(
  pathname: string,
  items: readonly BreadcrumbItem[],
  options?: ShouldShowBreadcrumbTrailOptions,
): boolean {
  if (items.length <= 1) {
    return false;
  }

  if (hasPageLocalBreadcrumbWayfinding(pathname)) {
    return false;
  }

  if (options?.buyerGoldenJourneyNav !== null && options?.buyerGoldenJourneyNav !== undefined) {
    return false;
  }

  if (items.length >= 3) {
    return true;
  }

  const normalizedPath = normalizePathname(pathname);

  if (hasRunScopedReviewParentCrumb(items, options?.queryRunId)) {
    return true;
  }

  if (hasCustomReviewsListReturnHref(options?.reviewsListReturnHref)) {
    return true;
  }

  if (isHelpTopicPath(normalizedPath)) {
    return true;
  }

  if (isCrossNamespaceOrientationPath(normalizedPath)) {
    return true;
  }

  if (isDetailPagePath(normalizedPath)) {
    return true;
  }

  return false;
}
