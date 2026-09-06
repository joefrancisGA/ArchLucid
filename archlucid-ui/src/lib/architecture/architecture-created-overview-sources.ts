import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedOverviewSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Overview tab Sources — structured brief orientation before finalize.
 */
export const ARCHITECTURE_CREATED_OVERVIEW_SOURCES: readonly ArchitectureCreatedOverviewSourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Start review (guided intake)", href: "/architecture/reviews/new?path=guided-intake" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO =
  "Use these follow-ups when create-home Overview orientation turns into clarifications, findings triage, or a corrected intake pass.";

export const ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE =
  "This create-home Overview tab summarizes the submitted architecture brief before finalize. It is not a finalized review record export trail.";

export const ARCHITECTURE_CREATED_OVERVIEW_EMPTY_HEADING = "No structured overview yet" as const;

export const ARCHITECTURE_CREATED_OVERVIEW_EMPTY_CAUSE =
  "Your brief was too thin for ArchLucid to extract sponsor report, risks, or constraints." as const;

export const ARCHITECTURE_CREATED_OVERVIEW_BUYER_EMPTY_CAUSE =
  "Add more detail in guided questions so ArchLucid can structure sponsor report, risks, and constraints." as const;

export const ARCHITECTURE_CREATED_OVERVIEW_SUBMITTED_BRIEF_SUMMARY =
  "Generated source and submitted brief" as const;

export const ARCHITECTURE_CREATED_OVERVIEW_SUBMITTED_BRIEF_SUMMARY_BUYER = "Submitted brief" as const;

export const ARCHITECTURE_CREATED_OVERVIEW_PROVENANCE_LEGEND =
  "Asserted — taken directly from your brief. Inferred — derived by ArchLucid and may need correction in guided questions." as const;

export const ARCHITECTURE_CREATED_OVERVIEW_PAGE_LEAD =
  "Structured summary of your submitted architecture brief before finalize.";

export const ARCHITECTURE_CREATED_OVERVIEW_BUYER_START_HERE_HELPER =
  "Review how ArchLucid structured your brief — guided clarifications and corrections remain available on sibling workspace tabs below.";
