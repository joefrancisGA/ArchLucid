/**
 * Safe rendering for API-derived counts so malformed payloads never surface as `NaN` in UI.
 */
export function finiteIntegerCountDisplay(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return String(Math.trunc(value));
}
