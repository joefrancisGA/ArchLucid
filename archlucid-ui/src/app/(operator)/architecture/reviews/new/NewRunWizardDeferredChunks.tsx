"use client";

import dynamic from "next/dynamic";

export const WizardStepAdvanced = dynamic(
  () => import("@/components/wizard/steps/WizardStepAdvanced").then((module) => module.WizardStepAdvanced),
  { loading: () => null },
);

export const WizardStepCloudInventoryContext = dynamic(
  () =>
    import("@/components/wizard/steps/WizardStepCloudInventoryContext").then(
      (module) => module.WizardStepCloudInventoryContext,
    ),
  { loading: () => null },
);

/** @deprecated Prefer {@link WizardStepCloudInventoryContext}. */
export const WizardStepAzureContext = WizardStepCloudInventoryContext;

export const WizardStepBaselineZip = dynamic(
  () => import("@/components/wizard/steps/WizardStepBaselineZip").then((module) => module.WizardStepBaselineZip),
  { loading: () => null },
);

export const WizardStepBaselineMetrics = dynamic(
  () =>
    import("@/components/wizard/steps/WizardStepBaselineMetrics").then(
      (module) => module.WizardStepBaselineMetrics,
    ),
  { loading: () => null },
);

export const WizardPostCreateEvidenceUploadPanel = dynamic(
  () =>
    import("@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel").then(
      (module) => module.WizardPostCreateEvidenceUploadPanel,
    ),
  { loading: () => null },
);

export const WizardStepTrack = dynamic(
  () => import("@/components/wizard/steps/WizardStepTrack").then((module) => module.WizardStepTrack),
  { loading: () => null },
);

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
