import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const marketingAppDir = dirname(fileURLToPath(import.meta.url));
const marketingComponentsDir = join(marketingAppDir, "..", "..", "..", "components", "marketing");

const welcomePageSource = readFileSync(
  join(marketingComponentsDir, "WelcomeMarketingPage.tsx"),
  "utf8",
);
const deferredSource = readFileSync(
  join(marketingComponentsDir, "welcome-marketing-deferred-chunks.tsx"),
  "utf8",
);
const marketingLayoutDeferredSource = readFileSync(
  join(marketingComponentsDir, "marketing-layout-deferred-chunks.tsx"),
  "utf8",
);
const marketingLayoutSource = readFileSync(join(marketingAppDir, "..", "layout.tsx"), "utf8");

describe("welcome marketing deferred imports (TB-2028)", () => {
  it("keeps MarketingTierPricingSection off the welcome page static import graph", () => {
    expect(welcomePageSource).not.toContain('from "./MarketingTierPricingSection"');
    expect(welcomePageSource).not.toContain('from "@/components/marketing/MarketingTierPricingSection"');
    expect(welcomePageSource).toContain("welcome-marketing-deferred-chunks");
    expect(welcomePageSource).toContain("MarketingTierPricingSectionDeferred");
    expect(welcomePageSource).not.toMatch(/^"use client"/m);
  });

  it("dynamic-imports pricing and defers marketing layout chrome", () => {
    expect(deferredSource).toContain('import("./MarketingTierPricingSection")');
    expect(deferredSource).toContain("next/dynamic");

    expect(marketingLayoutDeferredSource).toContain(
      'import("@/components/marketing/MarketingPublicFooter")',
    );
    expect(marketingLayoutDeferredSource).toContain(
      'import("@/components/MarketingAnalyticsConsentBanner")',
    );
    expect(marketingLayoutSource).not.toContain('from "@/components/marketing/MarketingPublicFooter"');
    expect(marketingLayoutSource).not.toContain('from "@/components/MarketingAnalyticsConsentBanner"');
    expect(marketingLayoutSource).toContain("marketing-layout-deferred-chunks");
  });
});
