/** Per-trace citation coverage — not review-wide completeness (UU-407). */
export function formatRunRetrievalCitationCoverage(citationCoverage: number | null | undefined): string {
  if (citationCoverage === null || citationCoverage === undefined || Number.isNaN(citationCoverage)) {
    return "Not recorded";
  }

  return `${Math.round(citationCoverage * 100)}%`;
}

export function formatRunRetrievalGroundingScoresLabel(
  scoreMetadataMalformed: boolean,
  scoreSummaries: ReadonlyArray<{ chunkId: string; score?: number | null }>,
): string {
  if (scoreMetadataMalformed) {
    return "degraded";
  }

  if (scoreSummaries.length === 0) {
    return "Not scored";
  }

  return scoreSummaries
    .slice(0, 2)
    .map((score) => {
      if (score.score === null || score.score === undefined || Number.isNaN(score.score)) {
        return score.chunkId;
      }

      return `${score.chunkId}: ${score.score.toFixed(4)}`;
    })
    .join(", ");
}
