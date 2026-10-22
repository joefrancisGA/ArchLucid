"use client";

import type { JSX } from "react";

import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

const reviewsNewWizardSkeletonLoadingWrapper = (_loading: JSX.Element): JSX.Element => <NewRunWizardSkeleton />;

export const ReviewsNewFirstPilotIntakeWizardDeferred = createDeferredComponentFromManifest(
  "reviews-new-first-pilot-intake-wizard",
  { loadingWrapper: reviewsNewWizardSkeletonLoadingWrapper },
);

export const ReviewsNewSocraticIntakeWizardDeferred = createDeferredComponentFromManifest(
  "reviews-new-socratic-intake-wizard",
  { loadingWrapper: reviewsNewWizardSkeletonLoadingWrapper },
);

export const ReviewsNewNewRunWizardClientDeferred = createDeferredComponentFromManifest(
  "reviews-new-new-run-wizard-client",
  { loadingWrapper: reviewsNewWizardSkeletonLoadingWrapper },
);

export const ReviewsNewPathSwitcherDeferred = createDeferredComponentFromManifest("reviews-new-path-switcher", {
  loadingWrapper: reviewsNewWizardSkeletonLoadingWrapper,
});
