import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedGovernanceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Governance tab Sources — pre-finalize readiness before approval workflow.
 */
export const ARCHITECTURE_CREATED_GOVERNANCE_SOURCES: readonly ArchitectureCreatedGovernanceSourceLink[] = [
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Compare two reviews", href: COMPARE_TWO_REVIEWS_PATH },
] as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_SOURCES_INTRO =
  "Use these follow-ups when create-home Governance readiness turns into findings triage, evidence search, or post-finalize approval workflow.";

export const ARCHITECTURE_CREATED_GOVERNANCE_CLAIM_DISCIPLINE =
  "This create-home Governance tab orients assessment before finalize. It is not the committed approval decision surface.";
