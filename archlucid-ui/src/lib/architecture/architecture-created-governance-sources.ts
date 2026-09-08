import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
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

export const ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "create-home Governance readiness turns into findings triage, evidence search, or post-finalize approval workflow",
);

export const ARCHITECTURE_CREATED_GOVERNANCE_CLAIM_DISCIPLINE =
  "This create-home Governance tab orients assessment before finalize. It is not the committed approval decision surface.";

export const ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_CREATED_GOVERNANCE_PRIMARY_CONTENT_ID = "architecture-created-governance-primary-content" as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_FIRST_VIEWPORT_TEST_ID =
  "architecture-created-governance-first-viewport" as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_SKIP_TARGET_ID = ARCHITECTURE_CREATED_GOVERNANCE_FIRST_VIEWPORT_TEST_ID;

export const ARCHITECTURE_CREATED_GOVERNANCE_SKIP_LINK_LABEL = "Skip to governance readiness" as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "architecture-created-governance-header-claim-discipline" as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID =
  "architecture-governance-orientation-bottom" as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_PAGE_LEAD =
  "Review governance readiness for this architecture draft before you finalize the review package.";

export const ARCHITECTURE_CREATED_GOVERNANCE_OVERVIEW =
  "Governance panels below summarize readiness checks, policy alignment cues, and approval follow-ups for this draft scope.";

export const ARCHITECTURE_CREATED_GOVERNANCE_START_HERE_CARD_TITLE = "Start here" as const;

export const ARCHITECTURE_CREATED_GOVERNANCE_BUYER_START_HERE_HELPER =
  "Confirm findings and evidence are ready, then open Approval help or the findings queue when readiness turns into post-finalize workflow.";
