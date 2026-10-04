import type { SecurityEvidencePathRankDetail } from "@/lib/security-evidence-path-types";

/** Lead with prose summary; composite sort key is advisory ordering only (UU-401). */
export function formatSecurityEvidencePathRankLead(rank: SecurityEvidencePathRankDetail): string {
  const summary = rank.explanationSummary.trim();

  if (summary.length > 0) {
    return summary;
  }

  return rank.dimensionProse.overall.trim().length > 0
    ? rank.dimensionProse.overall.trim()
    : "Rank recorded for this path.";
}

export function formatSecurityEvidencePathCompositeSortKeyLine(compositeSortScore: number): string {
  return `Composite sort key ${compositeSortScore.toFixed(4)}. Ordering only — not a percentage, probability, or live risk score.`;
}
