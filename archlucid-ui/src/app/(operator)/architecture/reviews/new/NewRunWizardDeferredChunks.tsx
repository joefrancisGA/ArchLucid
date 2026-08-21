"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const WizardStepAdvanced = createDeferredComponentFromManifest("reviews-new-wizard-step-advanced", {
  suppressLoading: true,
});

export const WizardStepCloudInventoryContext = createDeferredComponentFromManifest(
  "reviews-new-wizard-step-cloud-inventory",
  { suppressLoading: true },
);

/** @deprecated Prefer {@link WizardStepCloudInventoryContext}. */
export const WizardStepAzureContext = WizardStepCloudInventoryContext;

export const WizardStepBaselineZip = createDeferredComponentFromManifest("reviews-new-wizard-step-baseline-zip", {
  suppressLoading: true,
});

export const WizardStepBaselineMetrics = createDeferredComponentFromManifest(
  "reviews-new-wizard-step-baseline-metrics",
  { suppressLoading: true },
);

export const WizardPostCreateEvidenceUploadPanel = createDeferredComponentFromManifest(
  "reviews-new-wizard-post-create-evidence",
  { suppressLoading: true },
);

export const WizardStepTrack = createDeferredComponentFromManifest("reviews-new-wizard-step-track", {
  suppressLoading: true,
});

export const ArchitectureRequestWizardHelpDrawer = createDeferredComponentFromManifest(
  "reviews-new-wizard-help-drawer",
  { suppressLoading: true },
);

export const QuickStartWizard = createDeferredComponentFromManifest("reviews-new-quick-start-wizard", {
  suppressLoading: true,
});

export const SimplifiedPilotWizard = createDeferredComponentFromManifest("reviews-new-simplified-pilot-wizard", {
  suppressLoading: true,
});
