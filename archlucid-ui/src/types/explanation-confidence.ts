import type { components } from "@/lib/api-types.generated";

/** OpenAPI string enum for coarse evaluation-backed confidence (JSON via JsonStringEnumConverter). */
export type FindingConfidenceLevel = "High" | "Medium" | "Low";

/** OpenAPI wire enum for the same coarse buckets (string JSON; legacy numeric wire still normalized at runtime). */
export type FindingConfidenceLevelWire = components["schemas"]["FindingConfidenceLevel"];

/** Normalizes numeric or string API confidence to operator-facing labels. */
export function normalizeFindingConfidenceLevel(
  level: FindingConfidenceLevelWire | FindingConfidenceLevel | number | string | null | undefined,
): FindingConfidenceLevel | null {
  if (level === "High" || level === 0) {
    return "High";
  }

  if (level === "Medium" || level === 1) {
    return "Medium";
  }

  if (level === "Low" || level === 2) {
    return "Low";
  }

  if (typeof level === "string") {
    const trimmed = level.trim();
    const normalized =
      trimmed.length > 0
        ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
        : trimmed;

    if (normalized === "High" || normalized === "Medium" || normalized === "Low") {
      return normalized;
    }
  }

  return null;
}

/** Parses API ratio fields that may arrive as JSON numbers or decimal strings. */
export function normalizeFiniteRatio(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/** Converts API trace completeness ratio (0–1 or 0–100) to a whole-number percent label. */
export function traceCompletenessPercent(ratio: number | string | null | undefined): number | null {
  const normalized = normalizeFiniteRatio(ratio);

  if (normalized === null) {
    return null;
  }

  return normalized <= 1 ? Math.round(normalized * 100) : Math.round(normalized);
}

export type FindingTraceConfidenceDto = components["schemas"]["FindingTraceConfidenceDto"];
