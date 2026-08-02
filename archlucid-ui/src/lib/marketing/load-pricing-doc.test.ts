import { describe, expect, it } from "vitest";

import { loadPricingDoc } from "@/lib/marketing/load-pricing-doc";

describe("loadPricingDoc", () => {
  it("reads the shipped pricing catalog so marketing tiers render server-side", () => {
    const doc = loadPricingDoc();

    expect(doc).not.toBeNull();
    expect(doc?.currency).toBeTruthy();
    expect(doc?.packages.length).toBeGreaterThan(0);
  });
});
