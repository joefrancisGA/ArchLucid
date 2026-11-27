import { describe, expect, it } from "vitest";

import { SECURENOW_UPGRADE_CTA_LEAD } from "@/lib/product-line/securenow-commercial-upgrade-cta-copy";
import { SECURENOW_PROCUREMENT_TRUST_LEAD } from "@/lib/product-line/securenow-procurement-trust-copy";
import { PRODUCT_LINE_ENTITLEMENT_NOT_IN_PLAN_HEADING } from "@/lib/product-line/product-line-route-blocked-entitlement-copy";

describe("score lift round142 batch honesty", () => {
  it("does not imply CPA SOC 2 or bundled SecureNow entitlements", () => {
    expect(SECURENOW_PROCUREMENT_TRUST_LEAD).toContain("CPA-issued SOC 2 report is not published");
    expect(SECURENOW_UPGRADE_CTA_LEAD).toContain("do not include SecureNow SKU entitlements");
    expect(PRODUCT_LINE_ENTITLEMENT_NOT_IN_PLAN_HEADING).toContain("Not in your current product shell");
  });
});
