import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { PLANNING_PATH, PLANNING_PLAN_DETAIL_PATH_PREFIX } from "@/lib/planning-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const PLANNING_PLAN_DETAIL_PAGE_TITLE = "Improvement plan" as const;

export const PLANNING_PLAN_DETAIL_PAGE_SUBTITLE =
  "Read-only improvement plan with priority, linked evidence counts, and action steps." as const;

export const PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER =
  "Priority, linked evidence, and action steps from captured review feedback." as const;

export function planningPlanDetailPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? PLANNING_PLAN_DETAIL_PAGE_SUBTITLE_BUYER
    : PLANNING_PLAN_DETAIL_PAGE_SUBTITLE;
}

export const PLANNING_PLAN_DETAIL_LOADING_STATUS = "Loading improvement plan…";

export const PLANNING_PLAN_DETAIL_LOAD_RETRY_LABEL = "Try again";

export const PLANNING_PLAN_DETAIL_REFRESH_LABEL = "Refresh";

export const PLANNING_PLAN_DETAIL_REFRESHING_LABEL = "Refreshing…";

export const PLANNING_PLAN_DETAIL_LAST_UPDATED_PREFIX = "Created";

export const PLANNING_PLAN_DETAIL_MISSING_PLAN_ID_TITLE = "Plan not specified";

export const PLANNING_PLAN_DETAIL_MISSING_PLAN_ID_BODY =
  "Open a plan from Improvement planning to review its priority, evidence links, and action steps.";

export const PLANNING_PLAN_DETAIL_CLAIM_DISCIPLINE =
  "This plan is derived from captured review feedback in the current workspace — not a sealed-review diligence Sources trail.";

export const PLANNING_PLAN_DETAIL_SOURCES_INTRO =
  "Return to Improvement planning for themes and peer plans, or open reviews and findings when this plan needs execution follow-up.";


/** Operator Sources — no self-href to plan detail routes. */
export const PLANNING_PLAN_DETAIL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Improvement planning", href: PLANNING_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Product learning", href: "/internal/product-learning" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export { PLANNING_PLAN_DETAIL_PATH_PREFIX };
