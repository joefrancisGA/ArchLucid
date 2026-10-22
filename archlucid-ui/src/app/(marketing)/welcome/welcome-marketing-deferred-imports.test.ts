import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

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
const manifestLoaderSource = readDeferredChunkImportLoaderSource();

describe("welcome marketing deferred imports (TB-2028)", () => {
  it("keeps MarketingTierPricingSection off the welcome page static import graph", () => {
    expect(welcomePageSource).not.toContain('from "./MarketingTierPricingSection"');
    expect(welcomePageSource).not.toContain('from "@/components/marketing/MarketingTierPricingSection"');
    expect(welcomePageSource).toContain("welcome-marketing-deferred-chunks");
    expect(welcomePageSource).toContain("MarketingTierPricingSectionDeferred");
    expect(welcomePageSource).not.toMatch(/^"use client"/m);
  });

  it("dynamic-imports every marketing deferred module via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(marketingLayoutDeferredSource).toContain("createDeferredComponentFromManifest");
    expect(marketingLayoutDeferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/marketing/MarketingTierPricingSection")');
    expect(manifestLoaderSource).toContain('import("@/components/MarketingFirstTouchCapture")');
    expect(manifestLoaderSource).toContain('import("@/components/MicrosoftClarityLoader")');
    expect(manifestLoaderSource).toContain('import("@/components/marketing/MarketingPublicFooter")');
    expect(manifestLoaderSource).toContain('import("@/components/MarketingAnalyticsConsentBanner")');
    expect(deferredSource).toContain("marketing-welcome-tier-pricing-section");
    expect(marketingLayoutDeferredSource).toContain("marketing-first-touch-capture");
    expect(marketingLayoutDeferredSource).toContain("marketing-public-footer");
    expect(marketingLayoutSource).not.toContain('from "@/components/marketing/MarketingPublicFooter"');
    expect(marketingLayoutSource).not.toContain('from "@/components/MarketingAnalyticsConsentBanner"');
    expect(marketingLayoutSource).toContain("marketing-layout-deferred-chunks");
  });
});
