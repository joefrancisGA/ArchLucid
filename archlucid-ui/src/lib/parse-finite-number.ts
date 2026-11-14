/** Converts numeric API values without allowing NaN or Infinity into UI state. */
export function parseFiniteNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function finiteNumberOrDefault(value: unknown, fallback: number): number {
  return parseFiniteNumber(value) ?? fallback;
}

export function parseNonNegativeFiniteNumber(value: unknown): number | null {
  const parsed = parseFiniteNumber(value);

  if (parsed === null || parsed < 0) {
    return null;
  }

  return parsed;
}

export function finiteNonNegativeNumberOrDefault(value: unknown, fallback: number): number {
  return parseNonNegativeFiniteNumber(value) ?? fallback;
}
