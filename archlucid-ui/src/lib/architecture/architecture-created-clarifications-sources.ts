import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedClarificationsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Clarifications tab Sources — open gaps before finalize.
 * Twin committed review surface has no dedicated clarifications archTab twin.
 */
export const ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES: readonly ArchitectureCreatedClarificationsSourceLink[] =
  [
    { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
    { label: "Findings queue", href: "/governance/findings" },
    { label: "Search review evidence", href: "/insights/search-review-evidence" },
    { label: "Start review (guided questions)", href: "/architecture/reviews/new?path=guided-intake" },
    { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  ] as const;

export const ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO =
  "Use these follow-ups when create-home Clarifications gaps turn into evidence capture, findings triage, or another guided-questions pass.";

export const ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE =
  "This create-home Clarifications tab lists unresolved gaps and open questions before finalize. It is not a finalized review record export trail.";

export const ARCHITECTURE_CREATED_CLARIFICATIONS_PAGE_LEAD =
  "Open gaps and unanswered questions from your submitted brief before finalize.";

export const ARCHITECTURE_CREATED_CLARIFICATIONS_BUYER_START_HERE_HELPER =
  "Review what still needs an answer — sibling workspace tabs below cover diagram, findings, and evidence when gaps are resolved.";

export const ARCHITECTURE_CREATED_CLARIFICATIONS_BUYER_EMPTY_SUCCESS_BODY =
  "Your brief covers the required context. Use sibling workspace tabs when you are ready for diagram review, findings, or assessment progress.";
