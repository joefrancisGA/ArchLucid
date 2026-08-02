import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { PricingDoc } from "@/lib/pricing-types";

/**
 * Server-side read of `public/pricing.json` so tier cards arrive in the initial HTML.
 * Returns `null` when the file is missing or unparsable — callers pass that straight to
 * `MarketingTierPricingSection`, which then falls back to its client fetch of the same file.
 */
export function loadPricingDoc(): PricingDoc | null {
  try {
    const raw = readFileSync(join(process.cwd(), "public", "pricing.json"), "utf8");

    return JSON.parse(raw) as PricingDoc;
  } catch {
    return null;
  }
}
