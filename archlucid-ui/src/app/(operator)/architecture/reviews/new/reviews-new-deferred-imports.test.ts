import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));

const pathSwitcherSource = readFileSync(join(routeDir, "ReviewsNewPathSwitcher.tsx"), "utf8");
const intentCalloutDeferredSource = readFileSync(join(routeDir, "ReviewsNewDeferredIntentCallout.tsx"), "utf8");
const newRunWizardClientSource = readFileSync(join(routeDir, "NewRunWizardClient.tsx"), "utf8");
const newRunWizardDeferredSource = readFileSync(join(routeDir, "NewRunWizardDeferredChunks.tsx"), "utf8");
const firstPilotSource = readFileSync(join(routeDir, "FirstPilotIntakeWizard.tsx"), "utf8");
const socraticSource = readFileSync(join(routeDir, "SocraticIntakeWizard.tsx"), "utf8");
const quickReviewDeferredSource = readFileSync(join(routeDir, "QuickReviewWizardDeferredPanels.tsx"), "utf8");
const socraticDeferredSource = readFileSync(join(routeDir, "SocraticIntakeWizardDeferredPanels.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(routeDir, "../../../../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const bannedQuickReviewImports = [
  '@/components/usability/QuickReviewAdvancedConfigAccordion"',
  '@/components/usability/WizardEvidenceUploadZone"',
  '@/components/usability/WizardPackagePreview"',
  '@/components/cto-demo/CtoDemoFastCreatePanel"',
  '@/components/cto-demo/CtoDemoReviewModeCallout"',
] as const;

const bannedSocraticImports = ['@/components/draft-intake/DraftIntakeDecisionReceiptCard"'] as const;

const bannedNewRunWizardImports = [
  '@/components/wizard/steps/WizardStepAdvanced"',
  '@/components/wizard/steps/WizardStepCloudInventoryContext"',
  '@/components/wizard/steps/WizardStepBaselineZip"',
  '@/components/wizard/steps/WizardStepBaselineMetrics"',
  '@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel"',
  '@/components/wizard/steps/WizardStepTrack"',
  '@/components/wizard/ArchitectureRequestWizardHelpDrawer"',
] as const;

const bannedIntentCalloutImports = ['@/app/(operator)/architecture/reviews/new/NewReviewIntentCallout"'] as const;

const bannedSocraticAdvancedRailImports = [
  '@/app/(operator)/architecture/reviews/new/SocraticIntakeWizardAdvancedRail"',
] as const;

describe("reviews new deferred imports (TB-2371 wave 1)", () => {
  it("keeps quick review panels off FirstPilotIntakeWizard static import graph", () => {
    for (const bannedImport of bannedQuickReviewImports) {
      expect(firstPilotSource).not.toContain(bannedImport);
    }

    expect(firstPilotSource).toContain("QuickReviewWizardDeferredPanels");
    expect(firstPilotSource).toContain("WizardEvidenceUploadZone");
  });

  it("keeps decision receipt off SocraticIntakeWizard static import graph", () => {
    for (const bannedImport of bannedSocraticImports) {
      expect(socraticSource).not.toContain(bannedImport);
    }

    expect(socraticSource).toContain("SocraticIntakeWizardDeferredPanels");
    expect(socraticSource).toContain("DraftIntakeDecisionReceiptCard");
  });

  it("dynamic-imports manifest-backed reviews new panels via loaders", () => {
    expect(quickReviewDeferredSource).toContain("createDeferredComponentFromManifest");
    expect(manifestLoaderSource).toContain('import("@/components/usability/QuickReviewAdvancedConfigAccordion")');
    expect(manifestLoaderSource).toContain('import("@/components/usability/WizardEvidenceUploadZone")');
    expect(manifestLoaderSource).toContain('import("@/components/usability/WizardPackagePreview")');
    expect(manifestLoaderSource).toContain('import("@/components/cto-demo/CtoDemoFastCreatePanel")');
    expect(manifestLoaderSource).toContain('import("@/components/cto-demo/CtoDemoReviewModeCallout")');
    expect(manifestLoaderSource).toContain('import("@/components/draft-intake/DraftIntakeDecisionReceiptCard")');
    expect(quickReviewDeferredSource).toContain("reviews-new-quick-review-advanced-config");
    expect(quickReviewDeferredSource).toContain("reviews-new-wizard-evidence-upload");
    expect(socraticDeferredSource).toContain("reviews-new-draft-intake-decision-receipt");
    expect(socraticDeferredSource).toContain("reviews-new-socratic-advanced-rail");
  });

  it("keeps socratic deferred panels off inline component imports", () => {
    expect(socraticDeferredSource).not.toContain('import("@/components/draft-intake/DraftIntakeDecisionReceiptCard")');
    expect(socraticDeferredSource).not.toContain(
      'import("./SocraticIntakeWizardAdvancedRail").then((module) => module.SocraticIntakeWizardAdvancedRail)',
    );
  });
});

describe("reviews new deferred imports (TB-2371 wave 2)", () => {
  it("keeps migrated wizard steps off NewRunWizardClient static import graph", () => {
    for (const bannedImport of bannedNewRunWizardImports) {
      expect(newRunWizardClientSource).not.toContain(bannedImport);
    }

    expect(newRunWizardClientSource).toContain("NewRunWizardDeferredChunks");
    expect(newRunWizardClientSource).toContain("WizardStepAdvanced");
    expect(newRunWizardClientSource).toContain("WizardStepTrack");
  });

  it("dynamic-imports manifest-backed new-run wizard steps via loaders", () => {
    expect(newRunWizardDeferredSource).toContain("createDeferredComponentFromManifest");
    expect(manifestLoaderSource).toContain('import("@/components/wizard/steps/WizardStepAdvanced")');
    expect(manifestLoaderSource).toContain('import("@/components/wizard/steps/WizardStepCloudInventoryContext")');
    expect(manifestLoaderSource).toContain('import("@/components/wizard/steps/WizardStepBaselineZip")');
    expect(manifestLoaderSource).toContain('import("@/components/wizard/steps/WizardStepBaselineMetrics")');
    expect(manifestLoaderSource).toContain('import("@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/wizard/steps/WizardStepTrack")');
    expect(newRunWizardDeferredSource).toContain("reviews-new-wizard-step-advanced");
    expect(newRunWizardDeferredSource).toContain("reviews-new-wizard-step-track");
  });

  it("keeps new-run deferred chunks fully manifest-driven after wave 3", () => {
    expect(newRunWizardDeferredSource).not.toContain("next/dynamic");
    expect(newRunWizardDeferredSource).toContain("reviews-new-wizard-help-drawer");
    expect(newRunWizardDeferredSource).toContain("reviews-new-quick-start-wizard");
    expect(newRunWizardDeferredSource).toContain("reviews-new-simplified-pilot-wizard");
  });
});

describe("reviews new deferred imports (TB-2371 wave 3)", () => {
  it("keeps intent callout off path switcher static import graph", () => {
    for (const bannedImport of bannedIntentCalloutImports) {
      expect(pathSwitcherSource).not.toContain(bannedImport);
    }

    expect(pathSwitcherSource).toContain("ReviewsNewDeferredIntentCallout");
  });

  it("keeps socratic advanced rail off SocraticIntakeWizard static import graph", () => {
    for (const bannedImport of bannedSocraticAdvancedRailImports) {
      expect(socraticSource).not.toContain(bannedImport);
    }

    expect(socraticSource).toContain("SocraticIntakeWizardAdvancedRail");
  });

  it("dynamic-imports manifest-backed wave 3 panels via loaders", () => {
    expect(intentCalloutDeferredSource).toContain("createDeferredComponentFromManifest");
    expect(intentCalloutDeferredSource).toContain("reviews-new-intent-callout");
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/architecture/reviews/new/NewReviewIntentCallout")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/new/SocraticIntakeWizardAdvancedRail")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/wizard/ArchitectureRequestWizardHelpDrawer")');
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/architecture/reviews/new/QuickStartWizard")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/new/SimplifiedPilotWizard")',
    );
  });
});
