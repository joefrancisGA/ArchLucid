import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

/** Pre-release legacy bookmark sources retired (no next.config redirect). */
const RETIRED_HUB_REDIRECT_SOURCES = [
  "/settings/exec-digest",
  "/settings/alerts",
  "/alert-routing",
  "/advisory",
  "/advisory-scheduling",
  "/governance/first-30-days",
  "/digest-subscriptions",
  "/admin/ai-usage-cost",
  "/settings/cost-reporting",
  "/settings",
  "/settings/tenant",
  "/quick-start",
  "/recommendation-learning",
  "/onboarding",
  "/graph",
  "/ask",
  "/search",
  "/compare",
  "/evolution-review",
  "/governance/resolution",
  "/governance-resolution",
  "/scorecard",
  "/sponsor-report/architecture-scorecard",
] as const;

describe("next.config hub bookmark redirects", () => {
  it("does not ship retired pre-release hub bookmark redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    for (const source of RETIRED_HUB_REDIRECT_SOURCES) {
      expect(redirectRules?.find((rule) => rule.source === source)).toBeUndefined();
    }
  });
});
