export type CompareCostEstimateFormat = {
  readonly display: string;
  readonly unitUnknown: boolean;
};

/**
 * Formats cost delta cells without inventing currency or period when the payload is bare numeric.
 */
export function formatCompareCostEstimateCell(value: unknown): CompareCostEstimateFormat {
  if (value === null || value === undefined) {
    return { display: " — ", unitUnknown: false };
  }

  const s = String(value).trim();

  if (s.length === 0) {
    return { display: " — ", unitUnknown: false };
  }

  if (/^[\$\u00a3\u20ac]/.test(s)) {
    return {
      display: s,
      unitUnknown: false,
    };
  }

  if (/^\d+([\.,]\d+)?$/.test(s.replace(/,/g, ""))) {
    return {
      display: s,
      unitUnknown: true,
    };
  }

  return {
    display: s,
    unitUnknown: false,
  };
}
