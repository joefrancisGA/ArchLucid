import { MARKETING_ATTRIBUTION_QUERY_KEYS } from "@/lib/marketing/attribution-query-keys";

/**
 * Builds `/signup?…` from marketing page search params, defaulting `utm_source` when absent so analytics stay coherent.
 */
export function buildPricingSignupHref(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();

  for (const key of MARKETING_ATTRIBUTION_QUERY_KEYS) {
    const raw = searchParams[key];

    if (typeof raw === "string" && raw.trim() !== "") params.set(key, raw.trim());
  }

  if (!params.has("utm_source")) params.set("utm_source", "pricing_page");

  return `/signup?${params.toString()}`;
}
