export const COMPARE_STRUCTURED_BASELINE_VALUE_NOT_STORED =
  "Baseline review value was not stored." as const;

export const COMPARE_STRUCTURED_UPDATED_VALUE_NOT_STORED =
  "Updated review value was not stored." as const;

export const COMPARE_STRUCTURED_BASELINE_VALUE_STORED_EMPTY =
  "Baseline review value was stored empty." as const;

export const COMPARE_STRUCTURED_UPDATED_VALUE_STORED_EMPTY =
  "Updated review value was stored empty." as const;

/** Side-by-side compare cells (decision, security posture, cost). */
export function formatCompareStructuredSideValue(
  value: string | null | undefined,
  side: "baseline" | "updated",
): string {
  if (value === null || value === undefined) {
    return side === "baseline"
      ? COMPARE_STRUCTURED_BASELINE_VALUE_NOT_STORED
      : COMPARE_STRUCTURED_UPDATED_VALUE_NOT_STORED;
  }

  if (value.trim().length === 0) {
    return side === "baseline"
      ? COMPARE_STRUCTURED_BASELINE_VALUE_STORED_EMPTY
      : COMPARE_STRUCTURED_UPDATED_VALUE_STORED_EMPTY;
  }

  return value;
}

export function formatCompareStructuredNamedField(
  value: string | null | undefined,
  fieldLabel: string,
): string {
  if (value === null || value === undefined) {
    return `${fieldLabel} was not stored.`;
  }

  if (value.trim().length === 0) {
    return `${fieldLabel} was stored empty.`;
  }

  return value.trim();
}
