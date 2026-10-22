"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const QuickReviewAdvancedConfigAccordion = createDeferredComponentFromManifest(
  "reviews-new-quick-review-advanced-config",
  { suppressLoading: true },
);

export const WizardEvidenceUploadZone = createDeferredComponentFromManifest("reviews-new-wizard-evidence-upload", {
  suppressLoading: true,
});

export const WizardPackagePreview = createDeferredComponentFromManifest("reviews-new-wizard-package-preview", {
  suppressLoading: true,
});

export const CtoDemoFastCreatePanel = createDeferredComponentFromManifest("reviews-new-cto-demo-fast-create", {
  suppressLoading: true,
});

export const CtoDemoReviewModeCallout = createDeferredComponentFromManifest("reviews-new-cto-demo-review-mode-callout", {
  suppressLoading: true,
});
