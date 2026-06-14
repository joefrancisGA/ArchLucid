import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type BuyerOperateBackLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Buyer-polished shell: contextual return link from golden-path satellite routes to the canonical showcase package.
 */
export function buyerPolishedOperateBackLink(pathnameWithSearch: string): BuyerOperateBackLink | null {
  const path = (pathnameWithSearch.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";
  const packageHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

  if (path === "/" || path.startsWith(`${packageHref}/`) || path === packageHref) {
    return null;
  }

  if (
    path.startsWith("/graph") ||
    path.startsWith("/governance") ||
    path.startsWith("/audit") ||
    path.startsWith("/compare") ||
    path.startsWith("/manifests/") ||
    path.startsWith("/showcase/") ||
    path.startsWith("/ask")
  ) {
    return { label: "Back to review package", href: packageHref };
  }

  return null;
}

/** True when shell breadcrumbs already expose the same review-package href (via scoped `runId`). */
export function isBuyerOperateBackLinkRedundantWithBreadcrumbs(
  queryRunId: string,
  backLink: BuyerOperateBackLink,
): boolean {
  const trimmedRunId = queryRunId.trim();

  if (trimmedRunId.length === 0) {
    return false;
  }

  return backLink.href === `/reviews/${encodeURIComponent(trimmedRunId)}`;
}
