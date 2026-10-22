import { describe, expect, it } from "vitest";

import {
  MARKETING_PRICING_TIER_CTAS,
  MARKETING_PRICING_TIER_ORDER,
} from "@/lib/marketing/marketing-public-pricing";

describe("marketing-public-pricing", () => {
  it("keeps tier CTA accessible names distinct within each card", () => {
    for (const tierId of MARKETING_PRICING_TIER_ORDER) {
      const cta = MARKETING_PRICING_TIER_CTAS[tierId];
      const names = [cta.primaryLabel];

      if (cta.secondaryLabel !== undefined) {
        names.push(cta.secondaryLabel);
      }

      const uniqueNames = new Set(names.map((name) => name.trim().toLowerCase()));

      expect(uniqueNames.size, `${tierId} tier has duplicate CTA labels`).toBe(names.length);
    }
  });

  it("uses tier-qualified architect secondary signup copy", () => {
    expect(MARKETING_PRICING_TIER_CTAS.architect.secondaryLabel).toMatch(/architect/i);
    expect(MARKETING_PRICING_TIER_CTAS.architect.secondaryLabel).not.toBe("Start now");
  });
});
