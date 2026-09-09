import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedEvidenceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Evidence tab Sources — bulk upload / capture orientation before finalize.
 */
export const ARCHITECTURE_CREATED_EVIDENCE_SOURCES: readonly ArchitectureCreatedEvidenceSourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Evidence graph", href: "/insights/evidence-graph" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO =
  "Use these follow-ups when create-home Evidence upload turns into findings triage, search, or export readiness.";

export const ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "create-home Evidence upload turns into findings triage, search, or export readiness",
);

export const ARCHITECTURE_CREATED_EVIDENCE_CLAIM_DISCIPLINE =
  "This create-home Evidence tab is for attaching capture before finalize. It is not a finalized review record export trail.";

export const ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_CREATED_EVIDENCE_PRIMARY_CONTENT_ID = "architecture-created-evidence-primary-content" as const;

export const ARCHITECTURE_CREATED_EVIDENCE_FIRST_VIEWPORT_TEST_ID = "architecture-created-evidence-first-viewport" as const;

export const ARCHITECTURE_CREATED_EVIDENCE_SKIP_TARGET_ID = ARCHITECTURE_CREATED_EVIDENCE_FIRST_VIEWPORT_TEST_ID;

export const ARCHITECTURE_CREATED_EVIDENCE_SKIP_LINK_LABEL = "Skip to evidence capture" as const;

export const ARCHITECTURE_CREATED_EVIDENCE_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "architecture-created-evidence-header-claim-discipline" as const;

export const ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID =
  "architecture-evidence-orientation-bottom" as const;

export const ARCHITECTURE_CREATED_EVIDENCE_PAGE_LEAD =
  "Attach supporting capture for this architecture draft before you finalize the review package.";

export const ARCHITECTURE_CREATED_EVIDENCE_OVERVIEW =
  "Capture panels below list uploaded files, linked citations, and diagram cross-links for this draft scope.";

export const ARCHITECTURE_CREATED_EVIDENCE_START_HERE_CARD_TITLE = "Start here" as const;

export const ARCHITECTURE_CREATED_EVIDENCE_BUYER_START_HERE_HELPER =
  "Upload or link evidence that backs the brief, then open Findings or Search review evidence when capture turns into triage.";
