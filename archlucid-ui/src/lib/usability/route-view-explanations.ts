/**
 * Plain-language "Explain this view" copy for high-density operator routes.
 */

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export type RouteViewExplanation = {
  readonly title: string;
  readonly summary: string;
  readonly nextAction: string;
};

const ROUTE_VIEW_EXPLANATIONS: readonly { prefix: string; explanation: RouteViewExplanation }[] = [
  {
    prefix: "/graph",
    explanation: {
      title: "Evidence trail",
      summary: "This graph links your architecture inputs, pipeline steps, findings, and the signed review record.",
      nextAction: "Select a node to inspect provenance, then open linked findings from the side panel.",
    },
  },
  {
    prefix: "/compare",
    explanation: {
      title: "Compare two reviews",
      summary: "Side-by-side diff of two architecture reviews — findings, decision records, and cost deltas.",
      nextAction: "Pick a baseline and updated review, then read the structured comparison summary.",
    },
  },
  {
    prefix: "/governance/findings",
    explanation: {
      title: "Risk register",
      summary: "Review architecture risks created from findings, waivers, exceptions, and governance decisions.",
      nextAction: "Start with open risks, expiring exceptions, or risks without owners.",
    },
  },
  {
    prefix: "/governance",
    explanation: {
      title: OPERATOR_NAV_LINK_LABELS.governanceWorkflow,
      summary: "Approvals, promotions, and policy activations for committed architecture reviews.",
      nextAction: "Start from pending approvals or open the architecture risk register to clear blocking items.",
    },
  },
  {
    prefix: "/audit",
    explanation: {
      title: "Audit trail",
      summary: "Append-only record of authenticated actions in your workspace — search, filter, and export.",
      nextAction: "Search by actor or event type; export CSV when you need evidence for compliance review.",
    },
  },
  {
    prefix: "/dashboard",
    explanation: {
      title: "Executive dashboard",
      summary: "Sponsor-facing ROI and proof metrics derived from committed review packages.",
      nextAction: "Open a finalized review package to drill into findings confidence and value claims.",
    },
  },
];

export function routeViewExplanationForPathname(pathname: string): RouteViewExplanation | null {
  const path = (pathname ?? "").split("?")[0] ?? "";
  const sorted = [...ROUTE_VIEW_EXPLANATIONS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.explanation;
    }
  }

  return null;
}
