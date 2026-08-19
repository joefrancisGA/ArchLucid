import { describe, expect, it } from "vitest";

import { ExecDigestSponsorDeepLinkOperatorLinks } from "@/lib/digest/exec-digest-sponsor-deep-link-operator-links";

describe("exec-digest-sponsor-deep-link-operator-links", () => {
  it("builds dashboard and run collateral routes with encoded tokens", () => {
    expect(ExecDigestSponsorDeepLinkOperatorLinks.buildDashboardUrl("https://app.example.com", "a b")).toBe(
      "https://app.example.com/digest/sponsor?token=a%20b",
    );

    expect(
      ExecDigestSponsorDeepLinkOperatorLinks.buildRunCollateralUrl(
        "https://app.example.com",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "token",
      ),
    ).toBe("https://app.example.com/digest/sponsor/run/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?token=token");
  });
});
