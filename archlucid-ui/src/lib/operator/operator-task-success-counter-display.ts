/** Whole-number pilot adoption counters — missing wire values must not coerce to zero. */
export function safeNonNegativeWholeDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return "Not returned";
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return "Not returned";
  }

  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return "Not returned";
  }

  return String(Math.floor(numeric));
}
