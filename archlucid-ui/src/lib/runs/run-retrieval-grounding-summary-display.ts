/** Display helpers for run retrieval grounding rollup (UU-462, UU-473). */

export function formatRetrievalGroundingRatioPercent(
  value: number | string | null | undefined,
): string {
  if (typeof value === "string") {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return "Average citation coverage was not stored.";
    }

    value = parsed;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Average citation coverage was not stored.";
  }

  const pct = value > 0 && value <= 1 ? Math.round(value * 100) : Math.round(value);

  return `${pct}%`;
}

export function formatRetrievalTraceRowCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Trace row count was not stored.";
  }

  return String(value);
}

export function formatRetrievalRetrievedChunkCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Retrieved chunk count was not stored.";
  }

  return String(value);
}

/** @deprecated Prefer formatRetrievalTraceRowCount or formatRetrievalRetrievedChunkCount for labeled copy. */
export function formatRetrievalGroundingCount(value: number | null | undefined): string {
  return formatRetrievalTraceRowCount(value);
}

export function resolveRetrievalGroundingDispositionPresentation(
  disposition: string | null | undefined,
): { readonly titleSuffix: string; readonly dispositionKey: string | null } {
  const trimmed = disposition?.trim() ?? "";

  if (trimmed.length === 0) {
    return { titleSuffix: "Disposition not returned", dispositionKey: null };
  }

  return { titleSuffix: trimmed.toUpperCase(), dispositionKey: trimmed.toUpperCase() };
}
