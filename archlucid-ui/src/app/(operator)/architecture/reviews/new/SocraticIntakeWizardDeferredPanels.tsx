"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { SocraticIntakeWizardAdvancedRailProps } from "./SocraticIntakeWizardAdvancedRail";

export const DraftIntakeDecisionReceiptCard = createDeferredComponentFromManifest(
  "reviews-new-draft-intake-decision-receipt",
  { suppressLoading: true },
);

export const SocraticIntakeWizardAdvancedRail: ComponentType<SocraticIntakeWizardAdvancedRailProps> =
  createDeferredComponentFromManifest(
    "reviews-new-socratic-advanced-rail",
    { suppressLoading: true },
  ) as ComponentType<SocraticIntakeWizardAdvancedRailProps>;
