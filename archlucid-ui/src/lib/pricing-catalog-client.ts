import { type PricingDoc } from "@/lib/pricing-types";

/** Loads the canonical pricing catalog served from `public/pricing.json`. */
export async function fetchPricingCatalog(): Promise<PricingDoc> {
  const response = await fetch("/pricing.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(String(response.status));
  }

  return (await response.json()) as PricingDoc;
}
