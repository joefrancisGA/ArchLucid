import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const FINDING_DETAIL_CANONICAL_PATH_PATTERN =
  "/architecture/reviews/[reviewId]/findings/[findingId]" as const;

export const FINDING_DETAIL_CLAIM_DISCIPLINE =
  "This page is the disposition-facing finding summary for one architecture review finding — it is not a complete sealed-review diligence Sources package by itself. Open Evidence trace, review provenance, or a sealed record when you need the broader package.";

export const FINDING_DETAIL_SOURCES_INTRO =
  "Use these follow-ups when finding disposition leads into evidence trace, run provenance, or governance queues.";

export const FINDING_DETAIL_FOLLOW_UPS_TITLE = "Where to go next";

/** Static Sources when run/finding ids are unavailable. */
export const FINDING_DETAIL_SOURCES_STATIC: readonly EvidenceSourceLink[] = [
  { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
] as const;

export function buildFindingDetailSources(
  runId: string,
  findingId: string,
): readonly EvidenceSourceLink[] {
  const encRun = encodeURIComponent(runId.trim());

  return [
    { label: "Evidence trace", href: getFindingEvidenceTraceHref(runId, findingId) },
    { label: "Review provenance", href: `/architecture/reviews/${encRun}/provenance` },
    { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
    { label: "Findings help", href: inAppHelpHref("findings") },
    { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  ] as const;
}

/** Orientation-strip Sources — excludes on-page evidence-trace CTA duplicates. */
export function buildFindingDetailOrientationSources(
  runId: string,
  findingId: string,
): readonly EvidenceSourceLink[] {
  const evidenceTraceHref = getFindingEvidenceTraceHref(runId, findingId);

  return buildFindingDetailSources(runId, findingId).filter(
    (source) => source.href !== evidenceTraceHref,
  );
}
