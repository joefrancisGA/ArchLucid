export type CompareCostEstimateFormat = {
  readonly display: string;
  readonly unitUnknown: boolean;
};

export const COMPARE_COST_ESTIMATE_NOT_STORED = "Cost estimate was not stored." as const;

export const COMPARE_COST_ESTIMATE_STORED_EMPTY = "Cost estimate was stored empty." as const;

/**
 * Formats cost delta cells without inventing currency or period when the payload is bare numeric.
 */
export function formatCompareCostEstimateCell(value: unknown): CompareCostEstimateFormat {
  if (value === null || value === undefined) {
    return { display: COMPARE_COST_ESTIMATE_NOT_STORED, unitUnknown: false };
  }

  const s = String(value).trim();

  if (s.length === 0) {
    return { display: COMPARE_COST_ESTIMATE_STORED_EMPTY, unitUnknown: false };
  }

  if (/^[\$\u00a3\u20ac]/.test(s)) {
    return {
      display: s,
      unitUnknown: false,
    };
  }

  if (/^\d+([\.,]\d+)?$/.test(s.replace(/,/g, ""))) {
    return {
      display: "Unit not recorded",
      unitUnknown: true,
    };
  }

  return {
    display: s,
    unitUnknown: false,
  };
}
