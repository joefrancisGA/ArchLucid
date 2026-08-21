import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const EVIDENCE_TRACE_CANONICAL_PATH_PATTERN =
  "/architecture/reviews/[reviewId]/findings/[findingId]/evidence-trace" as const;

export const EVIDENCE_TRACE_CLAIM_DISCIPLINE =
  "This page shows the policy, evidence, reasoning, and audit linkage for one finding — not a full audit export by itself. Open the finding detail, review provenance, or sealed record when you need the broader package.";

export const EVIDENCE_TRACE_SOURCES_INTRO =
  "Use these follow-ups when the trace leads into finding triage, run provenance, or governance help.";


/**
 * Static Sources used when run/finding ids are not available (tests / failure shells).
 * Prefer {@link buildEvidenceTraceSources} on the live page.
 */
export const EVIDENCE_TRACE_SOURCES_STATIC: readonly EvidenceSourceLink[] = [
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Resolve outcomes help", href: inAppHelpHref("governance-approval") },
] as const;

export function buildEvidenceTraceSources(
  runId: string,
  findingId: string,
): readonly EvidenceSourceLink[] {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());

  return [
    { label: "Finding detail", href: `/architecture/reviews/${encRun}/findings/${encFinding}` },
    { label: "Review provenance", href: `/architecture/reviews/${encRun}/provenance` },
    { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
    { label: "Findings help", href: inAppHelpHref("findings") },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  ] as const;
}
