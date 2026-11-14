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
