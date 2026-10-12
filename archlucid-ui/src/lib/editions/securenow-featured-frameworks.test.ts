import { describe, expect, it } from "vitest";

import {
  featuredSecureNowFrameworkIds,
  sortFeaturedSecureNowFrameworks,
} from "@/lib/editions/securenow-featured-frameworks";

describe("SecureNow featured frameworks", () => {
  it("starts the generic edition with the framework-neutral priorities", () => {
    expect(featuredSecureNowFrameworkIds("generic").slice(0, 3)).toEqual([
      "nist-800-53-r5-architecture",
      "owasp-asvs-architecture",
      "microsoft-cloud-security-benchmark",
    ]);
  });

  it("puts ARC-AMPE first for UHG", () => {
    expect(featuredSecureNowFrameworkIds("uhg")[0]).toBe("arc-ampe-architecture-themes");
  });

  it("sorts only present featured packs and leaves other packs out", () => {
    const items = [
      { policyPackId: "cis-azure-foundations" },
      { policyPackId: "arc-ampe-architecture-themes" },
      { policyPackId: "other-pack" },
    ];

    expect(sortFeaturedSecureNowFrameworks(items, "uhg").map((item) => item.policyPackId)).toEqual([
      "arc-ampe-architecture-themes",
      "cis-azure-foundations",
    ]);
  });
});
