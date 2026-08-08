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
  "This create-home Overview tab summarizes the submitted architecture brief before finalize. It is not a signed-record Sources trail";
