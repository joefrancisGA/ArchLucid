"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const DraftIntakeDecisionReceiptCard = createDeferredComponentFromManifest(
  "reviews-new-draft-intake-decision-receipt",
  { suppressLoading: true },
);

export const SocraticIntakeWizardAdvancedRail = createDeferredComponentFromManifest(
  "reviews-new-socratic-advanced-rail",
  { suppressLoading: true },
);
