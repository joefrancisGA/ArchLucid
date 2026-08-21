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
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO =
  "Use these follow-ups when create-home Findings triage turns into the findings queue, evidence search, or approval readiness.";

export const ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE =
  "This create-home Findings tab lists assessment findings before finalize. It is not a signed-record Sources trail";

export const ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY =
  "Assessment in progress — findings appear as each stage completes.";

export const ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK =
  "View assessment progress on the Activity tab";

export const ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK = "Open clarifications";

export const ARCHITECTURE_CREATED_FINDINGS_FINALIZE_ELIGIBLE_EMPTY =
  "Assessment stages are complete and no findings were surfaced. You can finalize when approval readiness checks pass.";
