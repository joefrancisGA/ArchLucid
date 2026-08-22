import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type ArchitectureCreatedDiagramSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Diagram tab Sources — illustrative Mermaid orientation before finalize.
 */
export const ARCHITECTURE_CREATED_DIAGRAM_SOURCES: readonly ArchitectureCreatedDiagramSourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Evidence graph", href: "/insights/evidence-graph" },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Resolve outcomes help", href: inAppHelpHref("governance-approval") },
] as const;

export const ARCHITECTURE_CREATED_DIAGRAM_SOURCES_INTRO =
  "Use these follow-ups when create-home Diagram orientation turns into evidence capture, findings triage, or export readiness.";

export const ARCHITECTURE_CREATED_DIAGRAM_CLAIM_DISCIPLINE =
  "This create-home Diagram tab shows an illustrative architecture sketch before finalize. It is not authoritative architecture structure, not a finalized review record export trail,";
