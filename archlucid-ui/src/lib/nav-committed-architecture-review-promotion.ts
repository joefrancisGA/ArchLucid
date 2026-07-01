import type { NavLinkItem } from "@/lib/nav-config";

/** Analytical destinations promoted to essential tier after the first committed review. */
const COMMITTED_ARCHITECTURE_REVIEW_PROMOTED_HREFS = new Set<string>([
  "/compare",
  "/graph",
  "/value-report/pilot",
]);

/** Pilot essentials demoted to extended tier after the first committed review (TB-524). */
const COMMITTED_ARCHITECTURE_REVIEW_DEMOTED_HREFS = new Set<string>(["/onboarding"]);

/** Pilot-group essentials that stay visible before Review work disclosure expands. */
const COMMITTED_ARCHITECTURE_REVIEW_COLLAPSED_SIDEBAR_HREFS = new Set<string>(["/graph"]);

function navPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? "";
}

/**
 * When the tenant has a committed architecture review, treat Compare, Graph, and Export as essential
 * without requiring extended disclosure toggles. Only pilot-group destinations (Graph today) also
 * stay visible in the collapsed sidebar — Analysis/Governance clusters remain hidden until disclosure.
 */
export function applyCommittedArchitectureReviewNavPromotions(
  links: ReadonlyArray<NavLinkItem>,
  hasCommittedArchitectureReview: boolean,
): NavLinkItem[] {
  if (!hasCommittedArchitectureReview) {
    return [...links];
  }

  return links.map((link) => {
    const path = navPathWithoutQuery(link.href);

    if (COMMITTED_ARCHITECTURE_REVIEW_DEMOTED_HREFS.has(path)) {
      return {
        ...link,
        tier: "extended",
        defaultVisibleInCollapsedSidebar: undefined,
      };
    }

    if (!COMMITTED_ARCHITECTURE_REVIEW_PROMOTED_HREFS.has(path)) {
      return link;
    }

    return {
      ...link,
      tier: "essential",
      ...(COMMITTED_ARCHITECTURE_REVIEW_COLLAPSED_SIDEBAR_HREFS.has(path)
        ? { defaultVisibleInCollapsedSidebar: true }
        : {}),
    };
  });
}
