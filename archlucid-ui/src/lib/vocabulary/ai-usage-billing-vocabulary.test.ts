import { describe, expect, it } from "vitest";

import {
  AI_USAGE_BILLING_AI_USAGE_LINK,
  AI_USAGE_BILLING_BILLING_LINK,
  AI_USAGE_BILLING_COMPACT_LINE,
  AI_USAGE_BILLING_ESTIMATES_HONESTY,
  AI_USAGE_BILLING_HEADING,
  AI_USAGE_BILLING_WHY_TWO,
  buildAiUsageBillingVocabulary,
  resolveAiUsageBillingPeerLink,
} from "@/lib/vocabulary/ai-usage-billing-vocabulary";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";

describe("ai-usage-billing-vocabulary (TB-2253)", () => {
  it("explains why AI usage and billing stay separate and deep-links both", () => {
    const model = buildAiUsageBillingVocabulary();

    expect(model.heading).toBe(AI_USAGE_BILLING_HEADING);
    expect(model.whyTwo).toBe(AI_USAGE_BILLING_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("estimate");
    expect(model.whyTwo.toLowerCase()).toContain("invoice");
    expect(model.compactLine).toBe(AI_USAGE_BILLING_COMPACT_LINE);
    expect(model.estimatesHonesty).toBe(AI_USAGE_BILLING_ESTIMATES_HONESTY);
    expect(model.estimatesHonesty.toLowerCase()).toContain("estimate");
    expect(model.estimatesHonesty.toLowerCase()).toContain("invoice");

    expect(model.aiUsageLink).toEqual(AI_USAGE_BILLING_AI_USAGE_LINK);
    expect(model.aiUsageLink.href).toBe(AI_USAGE_SETTINGS_PATH);
    expect(model.aiUsageLink.href).toBe("/administration/ai-usage");

    expect(model.billingLink).toEqual(AI_USAGE_BILLING_BILLING_LINK);
    expect(model.billingLink.href).toBe(SETTINGS_BILLING_PATH);
    expect(model.billingLink.href).toBe("/administration/billing");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveAiUsageBillingPeerLink("ai-usage")).toEqual(AI_USAGE_BILLING_BILLING_LINK);
    expect(resolveAiUsageBillingPeerLink("billing")).toEqual(AI_USAGE_BILLING_AI_USAGE_LINK);
  });
});
