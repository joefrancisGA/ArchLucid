import type { RunRetrievalGroundingScoreSummary } from "@/types/agent-forensics";

/** Per-trace citation coverage — not review-wide completeness (UU-407, UU-501). */
export function formatRunRetrievalCitationCoverage(citationCoverage: number | null | undefined): string {
  if (citationCoverage === null || citationCoverage === undefined || Number.isNaN(citationCoverage)) {
    return "Citation coverage was not stored.";
  }

  if (!Number.isFinite(citationCoverage) || citationCoverage < 0 || citationCoverage > 100) {
    return "Citation coverage was not stored.";
  }

  const pct =
    citationCoverage > 0 && citationCoverage <= 1
      ? Math.round(citationCoverage * 100)
      : Math.round(citationCoverage);

  return `${pct}%`;
}

export const RUN_RETRIEVAL_SCORE_METADATA_MALFORMED_LABEL =
  "Score metadata could not be parsed." as const;

export const RUN_RETRIEVAL_DOCUMENT_METADATA_MALFORMED_LABEL =
  "Document metadata could not be parsed." as const;

export function formatRunRetrievalGroundingScoresLabel(
  scoreMetadataMalformed: boolean,
  scoreSummaries: readonly RunRetrievalGroundingScoreSummary[],
): string {
  if (scoreMetadataMalformed) {
    return RUN_RETRIEVAL_SCORE_METADATA_MALFORMED_LABEL;
  }

  if (scoreSummaries.length === 0) {
    return "Scores were not stored.";
  }

  return scoreSummaries
    .slice(0, 2)
    .map((score) => {
      if (score.score === null || score.score === undefined || Number.isNaN(score.score)) {
        return `${score.chunkId}: Score was not stored.`;
      }

      return `${score.chunkId}: ${score.score.toFixed(4)}`;
    })
    .join(", ");
}
