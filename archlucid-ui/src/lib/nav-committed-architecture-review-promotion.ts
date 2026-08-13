import type { NavLinkItem } from "@/lib/nav-config";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

/** Analytical destinations promoted to essential tier after the first committed review. */
const COMMITTED_ARCHITECTURE_REVIEW_PROMOTED_HREFS = new Set<string>([
  COMPARE_TWO_REVIEWS_PATH,
  EVIDENCE_GRAPH_PATH,
  "/insights/executive-summary",
]);

/** Pilot essentials demoted to extended tier and moved last within their group after the first committed review (TB-524). */
const COMMITTED_ARCHITECTURE_REVIEW_DEMOTED_HREFS = new Set<string>([FIRST_REVIEW_GUIDE_PATH]);

function navPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? "";
}

function isDemotedAfterFirstCommit(link: NavLinkItem): boolean {
  return COMMITTED_ARCHITECTURE_REVIEW_DEMOTED_HREFS.has(navPathWithoutQuery(link.href));
}

function isPromotedAfterFirstCommit(link: NavLinkItem): boolean {
  return COMMITTED_ARCHITECTURE_REVIEW_PROMOTED_HREFS.has(navPathWithoutQuery(link.href));
}

function applyTierAfterFirstCommit(link: NavLinkItem): NavLinkItem {
  if (isDemotedAfterFirstCommit(link)) {
    return { ...link, tier: "extended" };
  }

  if (isPromotedAfterFirstCommit(link)) {
    return { ...link, tier: "essential" };
  }

  return link;
}

/**
 * Demoted links keep their sidebar row (role is the only visibility gate since 2026-08-03) but give up
 * prime position, so a finished first-review guide stops leading the group it no longer belongs at the top of.
 */
function moveDemotedLinksLast(links: ReadonlyArray<NavLinkItem>): NavLinkItem[] {
  return [
    ...links.filter((link) => !isDemotedAfterFirstCommit(link)),
    ...links.filter(isDemotedAfterFirstCommit),
  ];
}

/**
 * When the tenant has a committed architecture review, treat Compare, Graph, and pilot outcomes as essential,
 * and demote first-run guidance to extended tier at the end of its group. Ordering and tier are presentation
 * and telemetry metadata only — no link is added or removed here.
 */
export function applyCommittedArchitectureReviewNavPromotions(
  links: ReadonlyArray<NavLinkItem>,
  hasCommittedArchitectureReview: boolean,
): NavLinkItem[] {
  if (!hasCommittedArchitectureReview) {
    return [...links];
  }

  return moveDemotedLinksLast(links.map(applyTierAfterFirstCommit));
}
