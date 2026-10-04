export type FiniteIntegerCountDisplayOptions = {
  /** When the API omits or sends a non-finite count. Default keeps the legacy em dash. */
  readonly missingLabel?: "dash" | "not-returned";
};

/**
 * Safe rendering for API-derived counts so malformed payloads never surface as `NaN` in UI.
 */
export function finiteIntegerCountDisplay(
  value: unknown,
  options?: FiniteIntegerCountDisplayOptions,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return options?.missingLabel === "not-returned" ? "Not returned" : " — ";
  }

  return String(Math.trunc(value));
}
