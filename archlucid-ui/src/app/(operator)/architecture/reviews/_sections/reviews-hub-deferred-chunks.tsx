"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { RunsIndexBeforeAfterPanelProps } from "@/components/runs/RunsIndexBeforeAfterPanel";
import type { RunsListClientProps } from "@/app/(operator)/architecture/reviews/RunsListClient";
import type { RunSummary } from "@/types/authority";

/** TB-2371 — welcome onboarding off reviews hub First Load JS. */
export const OperatorWelcomeOnboardingDeferred: ComponentType<{
  readonly serverEligible: boolean;
}> = createDeferredComponentFromManifest("reviews-hub-welcome-onboarding") as ComponentType<{
  readonly serverEligible: boolean;
}>;

export const ReviewsHubExploreSamplesDeferred: ComponentType = createDeferredComponentFromManifest(
  "reviews-hub-explore-samples",
);

export const ReviewsHubPackageIncludesDeferred: ComponentType = createDeferredComponentFromManifest(
  "reviews-hub-package-includes",
);

const ReviewsHubBeforeAfterDeltaPanelDeferredBase = createDeferredComponentFromManifest(
  "reviews-hub-before-after-delta",
  { suppressLoading: true },
);

export const ReviewsHubBeforeAfterDeltaPanelDeferred: ComponentType = () => (
  <ReviewsHubBeforeAfterDeltaPanelDeferredBase variant="top" />
);

export const ReviewsHubReviewInventoryDeferred: ComponentType<{
  readonly runs: readonly RunSummary[];
}> = createDeferredComponentFromManifest("reviews-hub-inventory") as ComponentType<{
  readonly runs: readonly RunSummary[];
}>;

export const RunsIndexBeforeAfterPanelDeferred: ComponentType<RunsIndexBeforeAfterPanelProps> =
  createDeferredComponentFromManifest("reviews-hub-index-before-after") as ComponentType<RunsIndexBeforeAfterPanelProps>;

type RunsListAggregateErrorBoundaryProps = RunsListClientProps;

export const RunsListAggregateErrorBoundaryDeferred: ComponentType<RunsListAggregateErrorBoundaryProps> =
  createDeferredComponentFromManifest("reviews-hub-list-error-boundary") as ComponentType<RunsListAggregateErrorBoundaryProps>;
