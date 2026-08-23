import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

const componentsDir = dirname(fileURLToPath(import.meta.url));
const sectionsDir = join(componentsDir, "../../app/(operator)/_sections");

const pageViewSource = readFileSync(join(sectionsDir, "OperatorHomePageView.tsx"), "utf8");
const belowFoldSource = readFileSync(join(sectionsDir, "OperatorHomeBelowFoldPanels.tsx"), "utf8");
const workspaceContextSource = readFileSync(
  join(componentsDir, "OperatorHomeWorkspaceContextDisclosure.tsx"),
  "utf8",
);
const panelsDeferredSource = readFileSync(join(componentsDir, "OperatorHomeDeferredPanels.tsx"), "utf8");
const onboardingDeferredSource = readFileSync(join(componentsDir, "OperatorHomeDeferredOnboarding.tsx"), "utf8");
const manifestLoaderSource = readDeferredChunkImportLoaderSource();

const bannedStaticImports = [
  '@/components/operator-home/RunsDashboardPanel"',
  '@/components/BeforeAfterDeltaPanel"',
  '@/components/operator-home/OperatorHomeWorkspaceStatusSection"',
  '@/components/operator/OperatorWelcomeOnboarding"',
  '@/components/trial/TrialWelcomeRunDeepLink"',
  '@/components/FirstValueReachedCallout"',
] as const;

describe("operator home secondary deferred imports (TB-2371 wave 2)", () => {
  it("keeps secondary home panels off static import graphs", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
      expect(belowFoldSource).not.toContain(bannedImport);
      expect(workspaceContextSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("OperatorHomeDeferredPanels");
    expect(pageViewSource).toContain("OperatorHomeDeferredOnboarding");
    expect(belowFoldSource).toContain("OperatorHomeFirstValueCallout");
    expect(workspaceContextSource).toContain("OperatorHomeDeltaPanel");
    expect(workspaceContextSource).toContain("OperatorHomeWorkspaceStatusPanel");
  });

  it("dynamic-imports secondary home modules via manifest loaders", () => {
    expect(panelsDeferredSource).toContain("createDeferredComponentFromManifest");
    expect(panelsDeferredSource).not.toContain("next/dynamic");
    expect(onboardingDeferredSource).toContain("createDeferredComponentFromManifest");
    expect(onboardingDeferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/operator-home/RunsDashboardPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/BeforeAfterDeltaPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/operator-home/OperatorHomeWorkspaceStatusSection")');
    expect(manifestLoaderSource).toContain('import("@/components/operator/OperatorWelcomeOnboarding")');
    expect(manifestLoaderSource).toContain('import("@/components/trial/TrialWelcomeRunDeepLink")');
    expect(manifestLoaderSource).toContain('import("@/components/FirstValueReachedCallout")');
    expect(panelsDeferredSource).toContain("operator-home-runs-dashboard");
    expect(panelsDeferredSource).toContain("operator-home-before-after-delta");
    expect(panelsDeferredSource).toContain("operator-home-workspace-status");
    expect(onboardingDeferredSource).toContain("operator-home-welcome-onboarding");
    expect(onboardingDeferredSource).toContain("operator-home-trial-welcome-deep-link");
    expect(onboardingDeferredSource).toContain("operator-home-first-value-callout");
  });
});
