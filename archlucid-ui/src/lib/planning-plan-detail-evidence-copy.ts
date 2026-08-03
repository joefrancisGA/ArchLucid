import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PLANNING_PLAN_DETAIL_PAGE_TITLE = "Improvement plan" as const;

export const PLANNING_PLAN_DETAIL_CLAIM_DISCIPLINE =
  "This plan is derived from captured review feedback in the current workspace — not a signed-review diligence Sources trail. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const PLANNING_PLAN_DETAIL_SOURCES_INTRO =
  "Return to Improvement planning for themes and peer plans, or open reviews and findings when this plan needs execution follow-up.";

export type PlanningPlanDetailSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to plan detail routes. */
export const PLANNING_PLAN_DETAIL_SOURCES: readonly PlanningPlanDetailSourceLink[] = [
  { label: "Improvement planning", href: "/planning" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: "/governance/findings" },
  { label: "Product learning", href: "/product-learning" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;

export const PLANNING_PLAN_DETAIL_PATH_PREFIX = "/planning/plans" as const;
