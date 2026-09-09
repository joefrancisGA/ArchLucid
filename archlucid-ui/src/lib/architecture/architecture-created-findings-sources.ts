import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedFindingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Findings tab Sources — assessment findings before finalize.
 */
export const ARCHITECTURE_CREATED_FINDINGS_SOURCES: readonly ArchitectureCreatedFindingsSourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO =
  "Use these follow-ups when create-home Findings triage turns into the findings queue, evidence search, or export readiness.";

export const ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "create-home Findings triage turns into the findings queue, evidence search, or export readiness",
);

export const ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE =
  "This create-home Findings tab lists assessment findings before finalize. It is not a finalized review record export trail.";

export const ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_CREATED_FINDINGS_PRIMARY_CONTENT_ID = "architecture-created-findings-primary-content" as const;

export const ARCHITECTURE_CREATED_FINDINGS_FIRST_VIEWPORT_TEST_ID = "architecture-created-findings-first-viewport" as const;

export const ARCHITECTURE_CREATED_FINDINGS_SKIP_TARGET_ID = ARCHITECTURE_CREATED_FINDINGS_FIRST_VIEWPORT_TEST_ID;

export const ARCHITECTURE_CREATED_FINDINGS_SKIP_LINK_LABEL = "Skip to findings triage" as const;

export const ARCHITECTURE_CREATED_FINDINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "architecture-created-findings-header-claim-discipline" as const;

export const ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_BOTTOM_TEST_ID =
  "architecture-findings-orientation-bottom" as const;

export const ARCHITECTURE_CREATED_FINDINGS_PAGE_LEAD =
  "Review assessment findings for this architecture draft before you finalize the review package.";

export const ARCHITECTURE_CREATED_FINDINGS_OVERVIEW =
  "Findings panels below list surfaced assessment items, severity cues, and triage follow-ups for this draft scope.";

export const ARCHITECTURE_CREATED_FINDINGS_START_HERE_CARD_TITLE = "Start here" as const;

export const ARCHITECTURE_CREATED_FINDINGS_BUYER_START_HERE_HELPER =
  "Scan surfaced findings, then open the findings queue or Search review evidence when triage turns into export readiness.";

export const ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY =
  "Assessment in progress — findings appear as each stage completes.";

export const ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK =
  "View assessment progress on the Activity tab";

export const ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK = "Open clarifications";

export const ARCHITECTURE_CREATED_FINDINGS_FINALIZE_ELIGIBLE_EMPTY =
  "Assessment stages are complete and no findings were surfaced. You can finalize when export readiness checks pass.";
