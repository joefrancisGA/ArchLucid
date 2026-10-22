import { describe, expect, it } from "vitest";

import {
  BILLING_HELP_PAGE_DISPLAY_TITLE,
  BILLING_HELP_PAGE_SUBTITLE,
  BILLING_HELP_PAGE_SUBTITLE_BUYER,
  BILLING_HELP_PAGE_TITLE,
  billingHelpPageSubtitle,
} from "@/lib/billing-help-guide-content";

describe("billing-help-guide-content", () => {
  it("uses product-safe billing help page naming", () => {
    expect(BILLING_HELP_PAGE_TITLE).toBe("Billing and plans");
    expect(BILLING_HELP_PAGE_DISPLAY_TITLE).toContain("help topic");
    expect(BILLING_HELP_PAGE_SUBTITLE).toContain("Billing and plans");
  });

  it("uses a shorter buyer subtitle", () => {
    expect(billingHelpPageSubtitle(true)).toBe(BILLING_HELP_PAGE_SUBTITLE_BUYER);
    expect(billingHelpPageSubtitle(false)).toBe(BILLING_HELP_PAGE_SUBTITLE);
    expect(BILLING_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(BILLING_HELP_PAGE_SUBTITLE.length);
  });
});
