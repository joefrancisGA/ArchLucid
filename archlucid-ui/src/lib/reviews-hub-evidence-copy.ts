import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REVIEWS_HUB_CLAIM_DISCIPLINE =
  "Architecture reviews is the inventory launcher for draft, active, and finalized packages — it is not a signed-review diligence Sources package by itself, a CPA SOC 2 attestation, or a published third-party pen-test report. Open a review workspace, Evidence graph, or Audit when you need sponsor-safe trails.";

export const REVIEWS_HUB_SOURCES_INTRO =
  "Use these follow-ups when list browsing turns into package detail, evidence search, or governance activity.";

export type ReviewsHubSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the reviews list hub. */
export const REVIEWS_HUB_SOURCES: readonly ReviewsHubSourceLink[] = [
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Evidence graph", href: "/insights/evidence-graph" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Review packages help", href: inAppHelpHref("review-packages") },
] as const;
