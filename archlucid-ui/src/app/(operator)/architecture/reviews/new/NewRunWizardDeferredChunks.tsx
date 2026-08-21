"use client";

import dynamic from "next/dynamic";

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

export const ArchitectureRequestWizardHelpDrawer = dynamic(
  () =>
    import("@/components/wizard/ArchitectureRequestWizardHelpDrawer").then(
      (module) => module.ArchitectureRequestWizardHelpDrawer,
    ),
  { loading: () => null },
);

export const QuickStartWizard = dynamic(
  () => import("./QuickStartWizard").then((module) => module.QuickStartWizard),
  { loading: () => null },
);

export const SimplifiedPilotWizard = dynamic(
  () => import("./SimplifiedPilotWizard").then((module) => module.SimplifiedPilotWizard),
  { loading: () => null },
);
