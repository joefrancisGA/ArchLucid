import type { NavLinkItem } from "@/lib/nav-config";

/** Analytical destinations promoted into the primary sidebar after the first committed review. */
const COMMITTED_ARCHITECTURE_REVIEW_PROMOTED_HREFS = new Set<string>([
  "/compare",
  "/graph",
  "/value-report/pilot",
]);

function navPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? "";
}

/**
 * When the tenant has a committed architecture review, treat Compare, Graph, and Export as essential
 * and visible in the collapsed pilot sidebar without requiring extended disclosure toggles.
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

    if (!COMMITTED_ARCHITECTURE_REVIEW_PROMOTED_HREFS.has(path)) {
      return link;
    }

    return {
      ...link,
      tier: "essential",
      defaultVisibleInCollapsedSidebar: true,
    };
  });
}
