import { REVIEWS_LIST_PATH, reviewDetailPath } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PROVENANCE_CLAIM_DISCIPLINE =
  "This coordinator provenance graph and timeline show linkage for one review — they are not a complete signed-review diligence Sources export by themselves. Open the Evidence trail or the review workspace before briefing sponsors. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const PROVENANCE_SOURCES_INTRO =
  "Use these follow-ups when provenance nodes need a fuller evidence trail, search, or review context.";

export type ProvenanceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Build operator Sources for a run — never self-links the provenance path. */
export function buildProvenanceSources(runId: string): readonly ProvenanceSourceLink[] {
  const trimmed = runId.trim();
  const reviewHref = trimmed.length > 0 ? reviewDetailPath(trimmed) : REVIEWS_LIST_PATH;
  const evidenceHref =
    trimmed.length > 0
      ? `/insights/evidence-graph?runId=${encodeURIComponent(trimmed)}`
      : "/insights/evidence-graph";

  return [
    { label: "Review workspace", href: reviewHref },
    { label: "Evidence trail", href: evidenceHref },
    { label: "Search review evidence", href: "/insights/search-review-evidence" },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
    { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
  ] as const;
}

export const PROVENANCE_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Coordinator provenance for one architecture review — linkage graph, trace timeline, and node/edge tables.",
  whatToDoNext:
    "Explore the graph or timeline, open linked findings or artifacts, then continue on the Evidence trail when you need a fuller diligence path.",
  whyEmpty: "Nodes and edges appear after the review has produced a provenance graph for this review.",
  whereToConfigurePrerequisite:
    "Open a finalized or in-progress review that has provenance data in the current workspace scope.",
} as const;

export const PROVENANCE_HELP_TOPIC = {
  slug: "evidence-trail",
  label: "Review provenance",
} as const;

/** True when the path is a run provenance page (canonical or nested). */
export function pathIsRunProvenance(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0] ?? "";

  return path.endsWith("/provenance");
}
