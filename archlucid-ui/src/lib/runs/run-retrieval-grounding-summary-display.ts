/** Display helpers for run retrieval grounding rollup (UU-462, UU-473). */

export function formatRetrievalGroundingRatioPercent(
  value: number | string | null | undefined,
): string {
  if (typeof value === "string") {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return "Not recorded";
    }

    value = parsed;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not recorded";
  }

  const pct = numeric > 0 && numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);

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
