export type EngineInsightNoveltyRateRow = {
  readonly engineType: string;
  readonly decisionGradeCount: number;
  readonly didNotThinkOfThatCount: number;
  readonly rate: number | null;
};

export type EngineInsightNoveltyRatesResponse = {
  readonly fromUtc: string;
  readonly toUtcExclusive: string;
  readonly rows: readonly EngineInsightNoveltyRateRow[];
};

export type EngineInsightNoveltyRatesPresentation = {
  readonly line: string;
};

/** claimBoundary: internal Working-mode metric — not buyer proof or G-REAL-06 evidence. */
export function formatEngineInsightNoveltyRatesPresentation(
  rows: readonly EngineInsightNoveltyRateRow[],
): EngineInsightNoveltyRatesPresentation | null {
  if (rows.length === 0) {
    return null;
  }

  const marked = rows.reduce((sum, row) => sum + row.didNotThinkOfThatCount, 0);
  const decisionGrade = rows.reduce((sum, row) => sum + row.decisionGradeCount, 0);

  if (decisionGrade <= 0) {
    return null;
  }

  return {
    line: `Novelty marks: ${marked} of ${decisionGrade} decision-grade findings (internal).`,
  };
}
