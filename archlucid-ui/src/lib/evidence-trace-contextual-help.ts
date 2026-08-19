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
    "Review the evidence region, return to finding detail for disposition, or open review provenance for the run trail.",
  whyEmpty: "Trace content appears after the finding payload loads for this review.",
  whereToConfigurePrerequisite:
    "Open a finding from a review or the governance findings queue before drilling into its evidence trace.",
} as const;
