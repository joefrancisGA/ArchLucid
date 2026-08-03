import type { NavLinkItem } from "@/lib/nav-config";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { isEvidenceGraphPath } from "@/lib/evidence-graph-route";
import { isFirstReviewGuidePath } from "@/lib/first-review-guide-route";

/**
 * Path helpers for the former pre-commit sidebar spine.
 * **Nav visibility no longer uses this gate** (owner 2026-08-03); kept for tests and deep-link docs.
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

  if (pathWithoutQuery === "/administration/settings/baseline" || pathWithoutQuery.startsWith("/administration/settings/baseline/")) {
    return true;
  }

  if (pathWithoutQuery === "/administration/settings/tenant" || pathWithoutQuery.startsWith("/administration/settings/tenant/")) {
    return true;
  }

  return false;
}

function navPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? "";
}

/**
 * Previously narrowed the sidebar until the first committed architecture review.
 * **Retired for visibility (owner 2026-08-03):** returns all links; role/authority gates remain in
 * `nav-shell-visibility.ts`. Deep-link eligibility helpers above are unchanged for other callers.
 */
export function filterNavLinksByCommittedArchitectureReviewGate(
  links: ReadonlyArray<NavLinkItem>,
  _hasCommittedArchitectureReview: boolean,
): NavLinkItem[] {
  return [...links];
}
