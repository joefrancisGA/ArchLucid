import type { NavLinkItem } from "@/lib/nav-config";
import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";

/**
 * Sidebar/palette narrowing before the first committed golden-manifest review (`CurrentPrincipal.hasCommittedArchitectureReview`).
 * Allowed: executive summary, review package hub, evidence graph, architecture draft capture, review intake,
 * plus help/onboarding, active review detail under `/reviews/...`. Operate destinations such as Alerts, Planning,
 * Digests, and Advisory stay out until **`hasCommittedArchitectureReview`** (tier/disclosure still applies after unlock);
 * deep links remain valid.
 */
export function pathnameEligibleBeforeFirstCommittedArchitectureReview(pathWithoutQuery: string): boolean {
  if (pathWithoutQuery === "/" || pathWithoutQuery === "/reviews") {
    return true;
  }

  if (pathWithoutQuery === ARCHITECTURES_LIST_PATH || pathWithoutQuery.startsWith(`${ARCHITECTURES_LIST_PATH}/`)) {
    return true;
  }

  if (pathWithoutQuery === "/reviews/new") {
    return true;
  }

  if (pathWithoutQuery.startsWith("/reviews/")) {
    return true;
  }

  if (pathWithoutQuery === "/graph" || pathWithoutQuery.startsWith("/graph/")) {
    return true;
  }

  if (pathWithoutQuery === "/dashboard") {
    return true;
  }

  if (pathWithoutQuery === "/help" || pathWithoutQuery.startsWith("/help/")) {
    return true;
  }

  if (pathWithoutQuery === "/onboarding" || pathWithoutQuery.startsWith("/onboarding/")) {
    return true;
  }

  if (pathWithoutQuery === "/settings/baseline" || pathWithoutQuery.startsWith("/settings/baseline/")) {
    return true;
  }

  if (pathWithoutQuery === "/settings/tenant" || pathWithoutQuery.startsWith("/settings/tenant/")) {
    return true;
  }

  return false;
}

function navPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? "";
}

/**
 * Pre-commit sidebar order: golden path first (capture → evidence → review package), then executive summary.
 * Matches Core Pilot funnel before the first committed manifest — not the post-commit buyer-polished catalog order.
 */
function preCommitNavLinkSortRank(pathWithoutQuery: string): number {
  if (pathWithoutQuery === "/") {
    return 0;
  }

  if (pathWithoutQuery === ARCHITECTURES_NEW_PATH || pathWithoutQuery.startsWith(`${ARCHITECTURES_LIST_PATH}/`)) {
    return 1;
  }

  if (pathWithoutQuery === "/reviews/new") {
    return 2;
  }

  if (pathWithoutQuery === "/graph" || pathWithoutQuery.startsWith("/graph/")) {
    return 3;
  }

  if (pathWithoutQuery === "/reviews" || pathWithoutQuery.startsWith("/reviews/")) {
    return 4;
  }

  if (pathWithoutQuery === "/dashboard") {
    return 5;
  }

  if (pathWithoutQuery === "/onboarding" || pathWithoutQuery.startsWith("/onboarding/")) {
    return 6;
  }

  if (pathWithoutQuery === "/help" || pathWithoutQuery.startsWith("/help/")) {
    return 7;
  }

  if (pathWithoutQuery === "/settings/baseline" || pathWithoutQuery.startsWith("/settings/baseline/")) {
    return 8;
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
