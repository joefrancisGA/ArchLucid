"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { RunsIndexBeforeAfterPanelProps } from "@/components/runs/RunsIndexBeforeAfterPanel";
import type { RunsListClientProps } from "@/app/(operator)/architecture/reviews/RunsListClient";
import type { RunSummary } from "@/types/authority";
import type { ReviewsWorkspaceSummary } from "./reviews-workspace-summary";

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

export const ReviewsHubBeforeAfterDeltaPanelDeferred: ComponentType<{
  readonly embeddedInCollapsible?: boolean;
}> = ({ embeddedInCollapsible = false }) => (
  <ReviewsHubBeforeAfterDeltaPanelDeferredBase
    variant="top"
    embeddedInCollapsible={embeddedInCollapsible}
  />
);

export type ReviewsHubReviewInventoryDeferredProps = {
  readonly runs: readonly RunSummary[];
  readonly summary: ReviewsWorkspaceSummary;
  readonly totalCount: number;
  readonly pageSize: number;
  readonly hasMore?: boolean;
};

export const ReviewsHubReviewInventoryDeferred: ComponentType<ReviewsHubReviewInventoryDeferredProps> =
  createDeferredComponentFromManifest("reviews-hub-inventory") as ComponentType<ReviewsHubReviewInventoryDeferredProps>;

export const RunsIndexBeforeAfterPanelDeferred: ComponentType<RunsIndexBeforeAfterPanelProps> =
  createDeferredComponentFromManifest("reviews-hub-index-before-after") as ComponentType<RunsIndexBeforeAfterPanelProps>;

type RunsListAggregateErrorBoundaryProps = RunsListClientProps;

export const RunsListAggregateErrorBoundaryDeferred: ComponentType<RunsListAggregateErrorBoundaryProps> =
  createDeferredComponentFromManifest("reviews-hub-list-error-boundary") as ComponentType<RunsListAggregateErrorBoundaryProps>;
