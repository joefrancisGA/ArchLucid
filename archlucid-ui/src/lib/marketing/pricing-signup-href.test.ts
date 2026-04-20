import { describe, expect, it } from "vitest";

import { buildPricingSignupHref } from "./pricing-signup-href";

describe("buildPricingSignupHref", () => {
  it("defaults utm_source to pricing_page", () => {
    expect(buildPricingSignupHref({})).toBe("/signup?utm_source=pricing_page");
  });

  it("preserves forwarded UTM keys and overrides default utm_source when provided", () => {
    const href = buildPricingSignupHref({
      utm_source: "email",
      utm_campaign: "spring",
      gclid: "abc",
      ignored: "x",
    });

    expect(href).toContain("utm_source=email");
    expect(href).toContain("utm_campaign=spring");
    expect(href).toContain("gclid=abc");
    expect(href).not.toContain("ignored");
  });
});
