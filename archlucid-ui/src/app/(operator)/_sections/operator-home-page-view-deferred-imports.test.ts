import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const operatorDir = join(sectionsDir, "..");

const homePageViewSource = readFileSync(join(sectionsDir, "OperatorHomePageView.tsx"), "utf8");
const homePageSource = readFileSync(join(operatorDir, "page.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "operator-home-page-view-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readDeferredChunkImportLoaderSource();
const belowFoldSource = readFileSync(join(sectionsDir, "OperatorHomeBelowFoldPanels.tsx"), "utf8");
const advancedGuidancePanelSource = readFileSync(
  join(sectionsDir, "../../../components/operator-home/OperatorHomeAdvancedGuidancePanel.tsx"),
  "utf8",
);
const heroSource = readFileSync(
  join(sectionsDir, "../../../components/operator-home/BuyerPolishedHomeHeroSection.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/usability/PilotCommandCenterCard"',
  '@/components/operator-home/OperatorHomeSponsorRoiStrip"',
  '@/components/dev-testing/DevTestingQuickSwitchPanel"',
  '@/components/operator-home/OperatorHomeExamplesPlacement"',
  '@/components/operator-home/OperatorHomeWorkspaceContextDisclosure"',
  '@/components/cto-demo/CtoDemoSponsorLandingRedirect"',
  '@/components/operator-home/BuyerPolishedHomeHeroSection"',
  '@/components/operator-home/OperatorHomeGate"',
] as const;

describe("operator home deferred imports (TB-2145)", () => {
  it("keeps heavy home panels off OperatorHomePageView static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(homePageViewSource).not.toContain(bannedImport);
    }

    expect(homePageViewSource).toContain("operator-home-page-view-deferred-chunks");
    expect(homePageViewSource).toContain("PilotCommandCenterCardDeferred");
    expect(homePageViewSource).toContain("OperatorHomeSponsorRoiStripDeferred");
    expect(homePageViewSource).toContain("OperatorHomeBelowFoldPanelsDeferred");
    expect(homePageViewSource).toContain("BuyerPolishedHomeHeroSectionDeferred");
    expect(homePageViewSource).toContain("OperatorHomeGateDeferred");
  });

  it("defers CTO demo redirect off the home page server graph", () => {
    expect(homePageSource).not.toContain('@/components/cto-demo/CtoDemoSponsorLandingRedirect"');
    expect(homePageSource).toContain("CtoDemoSponsorLandingRedirectDeferred");
  });

  it("streams dashboard load under Suspense (no top-level dashboard await)", () => {
    expect(homePageSource).toContain("<Suspense");
    expect(homePageSource).toContain("OperatorHomeRunsDashboardAsync");
    expect(homePageSource).toContain("OperatorHomePageSuspenseFallback");
    expect(homePageSource).not.toContain("loadOperatorHomeRunsDashboardModel");
  });

  it("dynamic-imports deferred home modules via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/usability/PilotCommandCenterCard")');
    expect(manifestLoaderSource).toContain('import("@/components/operator-home/OperatorHomeSponsorRoiStrip")');
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/_sections/OperatorHomeBelowFoldPanels")');
    expect(manifestLoaderSource).toContain('import("@/components/operator-home/BuyerPolishedHomeHeroSection")');
    expect(manifestLoaderSource).toContain('import("@/components/operator-home/OperatorHomeGate")');
    expect(manifestLoaderSource).toContain('import("@/components/cto-demo/CtoDemoSponsorLandingRedirect")');
    expect(deferredSource).toContain("operator-home-cto-demo-sponsor-landing");
  });

  it("defers pilot command center in buyer-polished hero", () => {
    expect(heroSource).not.toContain('@/components/usability/PilotCommandCenterCard"');
    expect(heroSource).toContain("PilotCommandCenterCardDeferred");
  });

  it("defers advanced guidance off below-fold static import graph (TB-2371)", () => {
    expect(belowFoldSource).not.toContain('@/components/operator-home/OperatorHomeAdvancedGuidanceSection"');
    expect(belowFoldSource).toContain("OperatorHomeAdvancedGuidancePanel");
    expect(advancedGuidancePanelSource).toContain("createDeferredComponentFromManifest");
    expect(advancedGuidancePanelSource).toContain("operator-home-advanced-guidance");
    expect(manifestLoaderSource).toContain('import("@/components/operator-home/OperatorHomeAdvancedGuidanceSection")');
  });
});
