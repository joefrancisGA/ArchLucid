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
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO =
  "Use these follow-ups when create-home Evidence upload turns into findings triage, search, or approval readiness.";

export const ARCHITECTURE_CREATED_EVIDENCE_CLAIM_DISCIPLINE =
  "This create-home Evidence tab is for attaching capture before finalize. It is not a signed-record Sources trail";
