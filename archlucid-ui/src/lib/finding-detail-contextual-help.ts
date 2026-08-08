const EVIDENCE_TRACE_SUFFIX = "/evidence-trace";

/** True when pathname is finding detail (RRF), not evidence-trace (ERU). */
export function pathIsFindingDetail(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? "").trim();

  if (!path.includes("/findings/") || path.endsWith(EVIDENCE_TRACE_SUFFIX)) {
    return false;
  }

  if (!(path.includes("/architecture/reviews/") || path.includes("/reviews/"))) {
    return false;
  }

  // Require .../findings/{id} with no deeper specialty segment after the finding id.
  const marker = "/findings/";
  const idx = path.lastIndexOf(marker);

  if (idx < 0) {
    return false;
  }

  const after = path.slice(idx + marker.length);
  const segments = after.split("/").filter((part) => part.length > 0);

  return segments.length === 1;
}

export const FINDING_DETAIL_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Finding detail — disposition-facing summary, recommended actions, and wayfinding for one architecture finding.",
  whatToDoNext:
    "Review the finding narrative, open Evidence trace for provenance depth, or return to the review findings list.",
  whyEmpty: "Finding content appears after the inspect payload loads for this review finding.",
  whereToConfigurePrerequisite:
    "Open a finding from a review findings tab or the governance findings queue.",
} as const;
