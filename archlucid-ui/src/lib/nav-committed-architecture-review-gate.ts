import type { NavLinkItem } from "@/lib/nav-config";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { isEvidenceGraphPath } from "@/lib/evidence-graph-route";
import { isFirstReviewGuidePath } from "@/lib/first-review-guide-route";

/**
 * Sidebar/palette narrowing before the first committed golden-manifest review
 * (`CurrentPrincipal.hasCommittedArchitectureReview`). Allowed: home, architectures, review hub/detail,
 * evidence graph, executive dashboard, help/onboarding, and tenant-admin break-glass paths (baseline + tenant).
 * Operate destinations (governance, diagnostics, integrations, digests, compare, …) stay out until commit;
 * deep links remain valid at route level.
 */
export function pathnameEligibleBeforeFirstCommittedArchitectureReview(pathWithoutQuery: string): boolean {
  if (pathWithoutQuery === "/" || pathWithoutQuery === "/architecture/reviews") {
    return true;
  }

  if (pathWithoutQuery === ARCHITECTURES_LIST_PATH || pathWithoutQuery.startsWith(`${ARCHITECTURES_LIST_PATH}/`)) {
    return true;
  }

  if (pathWithoutQuery === "/architecture/reviews/new") {
    return true;
  }

  if (pathWithoutQuery.startsWith("/architecture/reviews/")) {
    return true;
  }

  if (isEvidenceGraphPath(pathWithoutQuery)) {
    return true;
  }

  if (pathWithoutQuery === EXECUTIVE_DASHBOARD_HREF || pathWithoutQuery.startsWith(`${EXECUTIVE_DASHBOARD_HREF}/`)) {
    return true;
  }

  if (pathWithoutQuery === "/help" || pathWithoutQuery.startsWith("/help/")) {
    return true;
  }

  if (isFirstReviewGuidePath(pathWithoutQuery)) {
    return true;
  }

  if (pathWithoutQuery === "/administration/baseline" || pathWithoutQuery.startsWith("/administration/baseline/")) {
    return true;
  }

  if (pathWithoutQuery === "/administration/tenant" || pathWithoutQuery.startsWith("/administration/tenant/")) {
    return true;
  }

  return false;
}

function navPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? "";
}

/**
 * Pre-commit sidebar order: golden path first (capture → evidence → architectures → reviews), then portfolio
 * overview and onboarding. Matches Core Pilot funnel before the first committed manifest.
 */
function preCommitNavLinkSortRank(pathWithoutQuery: string): number {
  if (pathWithoutQuery === "/") {
    return 0;
  }

  if (pathWithoutQuery === "/architecture/reviews/new") {
    return 1;
  }

  if (isEvidenceGraphPath(pathWithoutQuery)) {
    return 2;
  }

  if (pathWithoutQuery === ARCHITECTURES_LIST_PATH || pathWithoutQuery.startsWith(`${ARCHITECTURES_LIST_PATH}/`)) {
    return 3;
  }

  if (pathWithoutQuery === "/architecture/reviews" || pathWithoutQuery.startsWith("/architecture/reviews/")) {
    return 4;
  }

  if (pathWithoutQuery === EXECUTIVE_DASHBOARD_HREF || pathWithoutQuery.startsWith(`${EXECUTIVE_DASHBOARD_HREF}/`)) {
    return 5;
  }

  if (isFirstReviewGuidePath(pathWithoutQuery)) {
    return 6;
  }

  if (pathWithoutQuery === "/administration/baseline" || pathWithoutQuery.startsWith("/administration/baseline/")) {
    return 7;
  }

  if (pathWithoutQuery === "/administration/tenant" || pathWithoutQuery.startsWith("/administration/tenant/")) {
    return 8;
  }

  if (pathWithoutQuery === "/help" || pathWithoutQuery.startsWith("/help/")) {
    return 9;
  }

  return 99;
}

function reorderNavLinksForPreCommitArchitectureReviewGate(links: NavLinkItem[]): NavLinkItem[] {
  return [...links].sort((left, right) => {
    const rankDelta =
      preCommitNavLinkSortRank(navPathWithoutQuery(left.href)) -
      preCommitNavLinkSortRank(navPathWithoutQuery(right.href));

    if (rankDelta !== 0) {
      return rankDelta;
    }

    return left.href.localeCompare(right.href);
  });
}

/** Outermost gate: shrink operator nav until the tenant has a committed architecture review. */
export function filterNavLinksByCommittedArchitectureReviewGate(
  links: ReadonlyArray<NavLinkItem>,
  hasCommittedArchitectureReview: boolean,
): NavLinkItem[] {
  if (hasCommittedArchitectureReview) {
    return [...links];
  }

  const eligible = links.filter((link) =>
    pathnameEligibleBeforeFirstCommittedArchitectureReview(navPathWithoutQuery(link.href)),
  );

  return reorderNavLinksForPreCommitArchitectureReviewGate(eligible);
}
