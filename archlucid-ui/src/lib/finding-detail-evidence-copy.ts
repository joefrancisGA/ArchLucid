import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { getFindingEvidenceTraceHref } from "@/lib/finding-evidence-navigation";

export const FINDING_DETAIL_CANONICAL_PATH_PATTERN =
  "/architecture/reviews/[runId]/findings/[findingId]" as const;

export const FINDING_DETAIL_CLAIM_DISCIPLINE =
  "This page is the disposition-facing finding summary for one architecture review finding — it is not a complete signed-review diligence Sources package by itself. Open Evidence trace, review provenance, or a signed record when you need the broader package.";

export const FINDING_DETAIL_SOURCES_INTRO =
  "Use these follow-ups when finding disposition leads into evidence trace, run provenance, or governance queues.";

export type FindingDetailSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Static Sources when run/finding ids are unavailable. */
export const FINDING_DETAIL_SOURCES_STATIC: readonly FindingDetailSourceLink[] = [
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
] as const;

export function buildFindingDetailSources(
  runId: string,
  findingId: string,
): readonly FindingDetailSourceLink[] {
  const encRun = encodeURIComponent(runId.trim());

  return [
    { label: "Evidence trace", href: getFindingEvidenceTraceHref(runId, findingId) },
    { label: "Review provenance", href: `/architecture/reviews/${encRun}/provenance` },
    { label: "Findings queue", href: "/governance/findings" },
    { label: "Findings help", href: inAppHelpHref("findings") },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  ] as const;
}
