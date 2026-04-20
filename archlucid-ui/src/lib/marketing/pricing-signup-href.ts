/** Query keys copied from the pricing page onto `/signup` for attribution continuity. */
const forwardedKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

/**
 * Builds `/signup?…` from marketing page search params, defaulting `utm_source` when absent so analytics stay coherent.
 */
export function buildPricingSignupHref(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();

  for (const key of forwardedKeys) {
    const raw = searchParams[key];

    if (typeof raw === "string" && raw.trim() !== "") params.set(key, raw.trim());
  }

  if (!params.has("utm_source")) params.set("utm_source", "pricing_page");

  return `/signup?${params.toString()}`;
}
