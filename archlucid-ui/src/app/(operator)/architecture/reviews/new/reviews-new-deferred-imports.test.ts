import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));

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
  });

  it("keeps remaining socratic panels on inline dynamic imports", () => {
    expect(socraticDeferredSource).toContain("next/dynamic");
    expect(socraticDeferredSource).toContain('import("./SocraticIntakeWizardAdvancedRail")');
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

  it("keeps remaining new-run wizard chunks on inline dynamic imports", () => {
    expect(newRunWizardDeferredSource).toContain("next/dynamic");
    expect(newRunWizardDeferredSource).toContain('import("@/components/wizard/ArchitectureRequestWizardHelpDrawer")');
    expect(newRunWizardDeferredSource).toContain('import("./QuickStartWizard")');
    expect(newRunWizardDeferredSource).toContain('import("./SimplifiedPilotWizard")');
  });
});
