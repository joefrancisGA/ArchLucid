import type { SecurityEvidencePathRankDetail } from "@/lib/security-evidence-path-types";

const RANK_EXPLANATION_SUMMARY_OMISSION = "Rank explanation summary was not stored." as const;

/** Lead with prose summary; composite sort key is advisory ordering only (UU-401). */
export function formatSecurityEvidencePathRankLead(rank: SecurityEvidencePathRankDetail): string {
  const summary = rank.explanationSummary.trim();

  if (summary.length > 0 && summary !== RANK_EXPLANATION_SUMMARY_OMISSION) {
    return summary;
  }

  return rank.dimensionProse.overall.trim().length > 0
    ? rank.dimensionProse.overall.trim()
    : "Rank explanation was not stored.";
}

export function formatSecurityEvidencePathCompositeSortKeyLine(compositeSortScore: number | null): string {
  if (compositeSortScore === null || !Number.isFinite(compositeSortScore)) {
    return "Composite sort key was not returned. Ordering only — not a percentage, probability, or live risk score.";
  }

  return `Composite sort key ${compositeSortScore.toFixed(4)}. Ordering only — not a percentage, probability, or live risk score.`;
}
