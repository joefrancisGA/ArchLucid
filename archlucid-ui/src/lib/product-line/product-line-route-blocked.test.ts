import { describe, expect, it } from "vitest";

import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { resolveProductLineRouteBlockedPresentation } from "@/lib/product-line/product-line-route-blocked";

describe("product-line-route-blocked", () => {
  it("preserves SecureNow remediation factory destination and switch target for Architecture shell", () => {
    const presentation = resolveProductLineRouteBlockedPresentation({
      pathname: SECURENOW_REMEDIATION_FACTORY_PATH,
      activeProductLine: "architecture",
    });

    expect(presentation.blockedPath).toBe(SECURENOW_REMEDIATION_FACTORY_PATH);
    expect(presentation.switchToProductLine).toBe("security");
    expect(presentation.reasonSentence).toMatch(/SecureNow/);
  });

  it("blocks Architecture reviews in the Security shell with architecture switch guidance", () => {
    const presentation = resolveProductLineRouteBlockedPresentation({
      pathname: "/architecture/reviews",
      activeProductLine: "security",
    });

    expect(presentation.blockedPath).toBe("/architecture/reviews");
    expect(presentation.switchToProductLine).toBe("architecture");
  });
});
