/** Display helpers for run retrieval grounding rollup (UU-462, UU-473). */

export function formatRetrievalGroundingRatioPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not recorded";
  }

  const pct = value > 0 && value <= 1 ? Math.round(value * 100) : Math.round(value);

  return `${pct}%`;
}

export function formatRetrievalGroundingCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not recorded";
  }

  return String(value);
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
