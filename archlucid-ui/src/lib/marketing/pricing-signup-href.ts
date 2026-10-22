import { MARKETING_ATTRIBUTION_QUERY_KEYS } from "@/lib/marketing/attribution-query-keys";

function firstNonEmptyAttributionValue(raw: string | string[] | undefined): string | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(raw)) {
    return null;
  }

  for (const entry of raw) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Builds `/signup?…` from marketing page search params, defaulting `utm_source` when absent so analytics stay coherent.
 */
export function buildPricingSignupHref(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();

  for (const key of MARKETING_ATTRIBUTION_QUERY_KEYS) {
    const value = firstNonEmptyAttributionValue(searchParams[key]);

    if (value !== null) {
      params.set(key, value);
    }
  }

  if (!params.has("utm_source")) params.set("utm_source", "pricing_page");

  return `/signup?${params.toString()}`;
}
