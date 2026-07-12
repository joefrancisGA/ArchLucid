/**
 * Plain-language "About this page" copy for routes without their own orientation header.
 * Routes with {@link OperatorPageHeader}, layer strips, or governance banners return `null`.
 */

export type RouteViewExplanation = {
  readonly title: string;
  readonly summary: string;
  readonly nextAction: string;
};

const ROUTE_VIEW_EXPLANATIONS: readonly { prefix: string; explanation: RouteViewExplanation }[] = [
  {
    prefix: "/audit",
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

  if (path === "/graph" || path.startsWith("/graph/")) {
    return null;
  }

  if (path === "/alerts" || path.startsWith("/alerts/")) {
    return null;
  }

  if (path === "/compare" || path.startsWith("/compare/")) {
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
