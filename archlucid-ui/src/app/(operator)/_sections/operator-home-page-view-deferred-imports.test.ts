import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const operatorDir = join(sectionsDir, "..");

const homePageViewSource = readFileSync(join(sectionsDir, "OperatorHomePageView.tsx"), "utf8");
const homePageSource = readFileSync(join(operatorDir, "page.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "operator-home-page-view-deferred-chunks.tsx"), "utf8");
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

  it("dynamic-imports deferred home modules", () => {
    expect(deferredSource).toContain('import("@/components/usability/PilotCommandCenterCard")');
    expect(deferredSource).toContain('import("@/components/operator-home/OperatorHomeSponsorRoiStrip")');
    expect(deferredSource).toContain('import("@/app/(operator)/_sections/OperatorHomeBelowFoldPanels")');
    expect(deferredSource).toContain('import("@/components/cto-demo/CtoDemoSponsorLandingRedirect")');
    expect(deferredSource).toContain('import("@/components/operator-home/BuyerPolishedHomeHeroSection")');
    expect(deferredSource).toContain('import("@/components/operator-home/OperatorHomeGate")');
    expect(deferredSource).toContain("next/dynamic");
  });

  it("defers pilot command center in buyer-polished hero", () => {
    expect(heroSource).not.toContain('@/components/usability/PilotCommandCenterCard"');
    expect(heroSource).toContain("PilotCommandCenterCardDeferred");
  });
});
