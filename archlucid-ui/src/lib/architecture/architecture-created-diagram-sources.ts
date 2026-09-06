import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedDiagramSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Diagram tab Sources — illustrative diagram before finalize.
 * Twin committed surface is reviewTab=architecture on ReviewDetailWorkspace (RRE hub chrome).
 */
export const ARCHITECTURE_CREATED_DIAGRAM_SOURCES: readonly ArchitectureCreatedDiagramSourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Start review (guided questions)", href: "/architecture/reviews/new?path=guided-intake" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_DIAGRAM_SOURCES_INTRO =
  "Use these follow-ups when create-home Diagram review turns into clarifications, findings triage, or evidence capture.";

export const ARCHITECTURE_CREATED_DIAGRAM_CLAIM_DISCIPLINE =
  "This create-home Diagram tab shows an illustrative architecture diagram before finalize. It is not a finalized review record export trail.";

export const ARCHITECTURE_CREATED_DIAGRAM_PAGE_LEAD =
  "Illustrative architecture diagram generated from your submitted brief before finalize.";

export const ARCHITECTURE_CREATED_DIAGRAM_BUYER_START_HERE_HELPER =
  "Review how ArchLucid visualized your brief — sibling workspace tabs below cover overview, clarifications, and findings when you need more detail.";

export const ARCHITECTURE_CREATED_DIAGRAM_BUYER_INSUFFICIENT_BODY =
  "Add more architecture detail in guided questions, then return here when ArchLucid can generate a diagram.";
