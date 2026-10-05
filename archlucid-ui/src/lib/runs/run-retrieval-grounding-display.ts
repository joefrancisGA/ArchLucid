/** Per-trace citation coverage — not review-wide completeness (UU-407, UU-501). */
export function formatRunRetrievalCitationCoverage(citationCoverage: number | null | undefined): string {
  if (citationCoverage === null || citationCoverage === undefined || Number.isNaN(citationCoverage)) {
    return "Not recorded";
  }

  if (!Number.isFinite(citationCoverage) || citationCoverage < 0 || citationCoverage > 100) {
    return "Not recorded";
  }

  const pct =
    citationCoverage > 0 && citationCoverage <= 1
      ? Math.round(citationCoverage * 100)
      : Math.round(citationCoverage);

  return `${pct}%`;
}

export function formatRunRetrievalGroundingScoresLabel(
  scoreMetadataMalformed: boolean,
  scoreSummaries: ReadonlyArray<{ chunkId: string; score: number | null | undefined }>,
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
