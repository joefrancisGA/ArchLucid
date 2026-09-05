import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { isSponsorDashboardPath } from "@/lib/sponsor/sponsor-dashboard-route";
import { resolveCommandPaletteDisplayShortcut } from "@/lib/keyboard-shortcut-display";

import {
  isGovernanceFindingsQueueHeaderSearchPath,
  isReviewsHubInventoryHeaderSearchPath,
} from "@/lib/shell-header-route-local-search";
import { isReviewDetailHeaderSearchPath } from "@/lib/review-detail-header-section-search";

/** Buyer-polished header search: route-aware label for the shell search + command palette. */
export function resolveShellHeaderSearchLabel(pathname: string): string {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (isReviewsHubInventoryHeaderSearchPath(path)) {
    return "Filter reviews";
  }

  if (isGovernanceFindingsQueueHeaderSearchPath(path)) {
    return "Filter findings";
  }

  if (isReviewDetailHeaderSearchPath(path)) {
    return "Jump to section";
  }

  if (path.startsWith("/insights/evidence-graph")) {
    return "Search evidence trail";
  }

  if (path.startsWith("/insights/ask-review-questions")) {
    return "Search review evidence";
  }

  if (path.startsWith("/audit")) {
    return "Search audit trail";
  }

  if (path.startsWith("/insights/compare-two-reviews")) {
    return "Search review change comparison";
  }

  if (path.startsWith("/governance/findings")) {
    return "Search findings";
  }

  if (path.startsWith("/governance")) {
    return "Search policy record";
  }

  const reviewPackageSubtree =
    /^\/architecture\/reviews\/[^/]+(?:\/|$)/u.test(path) ||
    /^\/(?:governance\/)?(?:signed|sealed)-records\/[^/]/u.test(path) ||
    /^\/architecture\/reviews\/[^/]+\/architecture/u.test(path) ||
    /^\/sponsor\/reviews\/[^/]/u.test(path);

  if (reviewPackageSubtree) {
    return "Search this review";
  }

  return "Search reviews";
}

/** Route-aware placeholder for buyer-polished shell header search. */
export function resolveShellHeaderSearchPlaceholder(pathname: string): string {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (isReviewsHubInventoryHeaderSearchPath(path)) {
    return "Filter reviews in this list…";
  }

  if (isGovernanceFindingsQueueHeaderSearchPath(path)) {
    return "Filter findings in this queue…";
  }

  if (isReviewDetailHeaderSearchPath(path)) {
    return "Jump to a section on this page…";
  }

  if (path.startsWith("/insights/evidence-graph")) {
    return "Jump to audit, finalized review record, governance, or type another destination…";
  }

  if (path.startsWith("/insights/ask-review-questions")) {
    return "Jump to sponsor report, finalized review record, evidence trail, or governance…";
  }

  if (path.startsWith("/insights/compare-two-reviews")) {
    return "Jump to review, finalized review record, or evidence trail…";
  }

  if (path.startsWith("/audit")) {
    return "Jump to sponsor report, evidence graph, finalized review record — or type a destination…";
  }

  if (path.startsWith("/governance")) {
    return "Jump to audit trail, findings, sponsor report…";
  }

  if (isSponsorDashboardPath(path)) {
    return "Jump to finalized review record, evidence graph, audit…";
  }

  if (path.startsWith("/signed-records") || path.includes("/architecture")) {
    return "Jump to sponsor report, graph, governance…";
  }

  if (path === "/" || path === "") {
    return `Find pages and reviews (${resolveCommandPaletteDisplayShortcut()})…`;
  }

  return GLOBAL_FIND_PAGE_SEARCH.placeholder;
}
