import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_TRACE_CANONICAL_PATH_PATTERN =
  "/architecture/reviews/[runId]/findings/[findingId]/evidence-trace" as const;

export const EVIDENCE_TRACE_CLAIM_DISCIPLINE =
  "This page shows the policy, evidence, reasoning, and audit linkage for one finding — it is not a complete signed-review diligence Sources package by itself, a CPA SOC 2 attestation, or a published third-party pen-test report. Open the finding detail, review provenance, or signed record when you need the broader package.";

export const EVIDENCE_TRACE_SOURCES_INTRO =
  "Use these follow-ups when the trace leads into finding disposition, run provenance, or governance help.";

export type EvidenceTraceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Static Sources used when run/finding ids are not available (tests / failure shells).
 * Prefer {@link buildEvidenceTraceSources} on the live page.
 */
export const EVIDENCE_TRACE_SOURCES_STATIC: readonly EvidenceTraceSourceLink[] = [
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;

export function buildEvidenceTraceSources(
  runId: string,
  findingId: string,
): readonly EvidenceTraceSourceLink[] {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());

  return [
    { label: "Finding detail", href: `/architecture/reviews/${encRun}/findings/${encFinding}` },
    { label: "Review provenance", href: `/architecture/reviews/${encRun}/provenance` },
    { label: "Findings queue", href: "/governance/findings" },
    { label: "Findings help", href: inAppHelpHref("findings") },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  ] as const;
}
