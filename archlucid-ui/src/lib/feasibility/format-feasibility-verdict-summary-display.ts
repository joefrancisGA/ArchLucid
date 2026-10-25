export const FEASIBILITY_VERDICT_SUMMARY_NOT_STORED = "Verdict summary was not stored." as const;
export const FEASIBILITY_VERDICT_SUMMARY_STORED_EMPTY = "Verdict summary was stored empty." as const;

export function formatFeasibilityVerdictSummaryForDisplay(
  summary: string | null | undefined,
): string {
  if (summary === null || summary === undefined) {
    return FEASIBILITY_VERDICT_SUMMARY_NOT_STORED;
  }

  if (summary.trim().length === 0) {
    return FEASIBILITY_VERDICT_SUMMARY_STORED_EMPTY;
  }

  return summary.trim();
}
