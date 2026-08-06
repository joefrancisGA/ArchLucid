/**
 * Plain-language "About this page" copy for routes without their own orientation header.
 * Routes with {@link OperatorPageHeader}, layer strips, or governance banners return `null`.
 */

export type RouteViewExplanation = {
  readonly title: string;
  readonly summary: string;
  readonly nextAction: string;
};

import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";

const ROUTE_VIEW_EXPLANATIONS: readonly { prefix: string; explanation: RouteViewExplanation }[] = [
  {
    prefix: GOVERNANCE_AUDIT_PATH,
    explanation: {
      title: "Audit trail",
      summary: "Append-only record of authenticated actions in your workspace — search, filter, and export.",
      nextAction: "Search by actor or event type; export CSV when you need evidence for compliance review.",
    },
  },
];

/** Returns compact orientation copy only when the route does not already own header guidance. */
export function routeViewExplanationForPathname(pathname: string): RouteViewExplanation | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path.startsWith("/governance")) {
    return null;
  }

  if (path === "/insights/evidence-graph" || path.startsWith("/insights/evidence-graph/")) {
    return null;
  }

  if (path === "/alerts" || path.startsWith("/alerts/")) {
    return null;
  }

  if (path === "/insights/compare-two-reviews" || path.startsWith("/insights/compare-two-reviews/")) {
    return null;
  }

  const sorted = [...ROUTE_VIEW_EXPLANATIONS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.explanation;
    }
  }

  return null;
}
