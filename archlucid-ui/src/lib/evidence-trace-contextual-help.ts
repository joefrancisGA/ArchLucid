const EVIDENCE_TRACE_SUFFIX = "/evidence-trace";

export const FINDING_EVIDENCE_TRACE_HELP_TOPIC_LABEL = "Finding evidence trace" as const;

/** True when pathname is a finding evidence-trace (ERU) route. */
export function pathIsFindingEvidenceTrace(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? "").trim();

  if (!path.includes("/findings/") || !path.endsWith(EVIDENCE_TRACE_SUFFIX)) {
    return false;
  }

  return path.includes("/architecture/reviews/") || path.includes("/reviews/");
}

export const EVIDENCE_TRACE_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Evidence trace — policy citations, evidence, reasoning, and audit linkage supporting one architecture finding.",
  whatToDoNext:
    "Review the evidence region, go back to the finding to resolve it, or open review provenance to see the full evidence path.",
  whyEmpty: "Trace content appears after the finding payload loads for this review.",
  whereToConfigurePrerequisite:
    "Open a finding from a review or the findings queue before drilling into its evidence trace.",
} as const;
