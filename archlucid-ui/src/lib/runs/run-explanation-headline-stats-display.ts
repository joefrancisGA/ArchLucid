export const RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL = "Decision count was not stored." as const;
export const RUN_EXPLANATION_FINDING_COUNT_NOT_STORED_LABEL = "Finding count was not stored." as const;
export const RUN_EXPLANATION_UNRESOLVED_COUNT_NOT_STORED_LABEL = "Unresolved item count was not stored." as const;
export const RUN_EXPLANATION_COMPLIANCE_GAP_COUNT_NOT_STORED_LABEL = "Compliance gap count was not stored." as const;

export function presentRunExplanationHeadlineCount(
  value: number | null | undefined,
  notStoredLabel: string,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return notStoredLabel;
  }

  return String(Math.trunc(value));
}

export function resolveRunExplanationFindingCountForHeadline(
  displayFindingCount: number | null | undefined,
  summaryFindingCount: number | undefined,
): string {
  if (displayFindingCount !== undefined && displayFindingCount !== null) {
    if (!Number.isFinite(displayFindingCount)) {
      return RUN_EXPLANATION_FINDING_COUNT_NOT_STORED_LABEL;
    }

    return String(Math.trunc(displayFindingCount));
  }

  return presentRunExplanationHeadlineCount(
    summaryFindingCount,
    RUN_EXPLANATION_FINDING_COUNT_NOT_STORED_LABEL,
  );
}
