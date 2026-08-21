"use client";

import dynamic from "next/dynamic";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const DraftIntakeDecisionReceiptCard = createDeferredComponentFromManifest(
  "reviews-new-draft-intake-decision-receipt",
  { suppressLoading: true },
);

export const SocraticIntakeWizardAdvancedRail = dynamic(
  () => import("./SocraticIntakeWizardAdvancedRail").then((module) => module.SocraticIntakeWizardAdvancedRail),
  { loading: () => null },
);
