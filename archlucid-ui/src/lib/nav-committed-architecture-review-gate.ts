import type { NavLinkItem } from "@/lib/nav-config";

/**
 * Sidebar/palette narrowing before the first committed golden-manifest review (`CurrentPrincipal.hasCommittedArchitectureReview`).
 * Allowed: the **pilot path** (Capture → Evidence → Review → Report) plus help/onboarding, reviews list/new, and
 * active review detail under `/reviews/...`. Operate destinations such as Alerts, Planning, Digests, and Advisory stay
 * out until **`hasCommittedArchitectureReview`** (tier/disclosure still applies after unlock); deep links remain valid.
 */
export function pathnameEligibleBeforeFirstCommittedArchitectureReview(pathWithoutQuery: string): boolean {
  if (pathWithoutQuery === "/" || pathWithoutQuery === "/reviews") {
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

  return false;
}

/** Outermost gate: shrink operator nav until the tenant has a committed architecture review. */
export function filterNavLinksByCommittedArchitectureReviewGate(
  links: ReadonlyArray<NavLinkItem>,
  hasCommittedArchitectureReview: boolean,
): NavLinkItem[] {
  if (hasCommittedArchitectureReview) {
    return [...links];
  }

  return links.filter((link) =>
    pathnameEligibleBeforeFirstCommittedArchitectureReview(link.href.split("?")[0] ?? ""),
  );
}
