import { describe, expect, it } from "vitest";

import {
  assertSecureNowArchitectHonestyCopy,
  SECURENOW_ARCHITECT_HONESTY_COPY_DENY_PATTERNS,
} from "@/lib/product-line/securenow-architect-honesty-copy";

describe("securenow-architect-honesty-copy", () => {
  it("flags percentage confidence and overclaimed movement language", () => {
    expect(() => assertSecureNowArchitectHonestyCopy("This path is 82% confirmed.")).toThrow();
    expect(() => assertSecureNowArchitectHonestyCopy("Data exfiltrated to the internet.")).toThrow();
    expect(() => assertSecureNowArchitectHonestyCopy("Apply to Azure now.")).toThrow();
    expect(() => assertSecureNowArchitectHonestyCopy("The tenant is compliant per auditor review.")).toThrow();
  });

  it("allows ordinal-band architect sentences", () => {
    assertSecureNowArchitectHonestyCopy(
      "This configuration creates a path from Internet through identity principal:aaaaaaaa to asset sa1. The path exists because role assignment inferred from tag metadata. Verify using cited hop evidence on the next inventory snapshot.",
    );
  });

  it("keeps deny patterns stable", () => {
    expect(SECURENOW_ARCHITECT_HONESTY_COPY_DENY_PATTERNS.length).toBeGreaterThan(0);
  });
});
