"use client";

import dynamic from "next/dynamic";

export const QuickReviewAdvancedConfigAccordion = dynamic(
  () =>
    import("@/components/usability/QuickReviewAdvancedConfigAccordion").then(
      (module) => module.QuickReviewAdvancedConfigAccordion,
    ),
  { loading: () => null },
);

export const WizardEvidenceUploadZone = dynamic(
  () => import("@/components/usability/WizardEvidenceUploadZone").then((module) => module.WizardEvidenceUploadZone),
  { loading: () => null },
);

export const WizardPackagePreview = dynamic(
  () => import("@/components/usability/WizardPackagePreview").then((module) => module.WizardPackagePreview),
  { loading: () => null },
);

export const CtoDemoFastCreatePanel = dynamic(
  () => import("@/components/cto-demo/CtoDemoFastCreatePanel").then((module) => module.CtoDemoFastCreatePanel),
  { loading: () => null },
);

export const CtoDemoReviewModeCallout = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoReviewModeCallout").then((module) => module.CtoDemoReviewModeCallout),
  { loading: () => null },
);
