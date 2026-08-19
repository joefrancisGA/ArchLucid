"use client";

import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

import type { RunsIndexBeforeAfterPanelProps } from "@/components/runs/RunsIndexBeforeAfterPanel";
import type { RunsListClientProps } from "@/app/(operator)/architecture/reviews/RunsListClient";

function reviewsHubDeferredLoading(label: string): JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      variant="compact"
      testId="reviews-hub-deferred-chunk-loading"
    />
  );
}

export const OperatorWelcomeOnboardingDeferred: ComponentType<{
  readonly serverEligible: boolean;
}> = dynamic(
  () =>
    import("@/components/operator/OperatorWelcomeOnboarding").then((module) => module.OperatorWelcomeOnboarding),
  {
    ssr: false,
    loading: () => reviewsHubDeferredLoading("Loading welcome guidance"),
  },
);

export const ReviewsHubExploreSamplesDeferred: ComponentType = dynamic(
  () => import("./ReviewsHubExploreSamples").then((module) => module.ReviewsHubExploreSamples),
  {
    ssr: false,
    loading: () => reviewsHubDeferredLoading("Loading sample reviews"),
  },
);

export const ReviewsHubPackageIncludesDeferred: ComponentType = dynamic(
  () => import("./ReviewsHubPackageIncludes").then((module) => module.ReviewsHubPackageIncludes),
  {
    ssr: false,
    loading: () => reviewsHubDeferredLoading("Loading package includes"),
  },
);

export const ReviewsHubBeforeAfterDeltaPanelDeferred: ComponentType = dynamic(
  () =>
    import("./ReviewsHubBeforeAfterDeltaPanel").then((module) => module.ReviewsHubBeforeAfterDeltaPanel),
  {
    ssr: false,
    loading: () => reviewsHubDeferredLoading("Loading review delta"),
  },
);

export const RunsIndexBeforeAfterPanelDeferred: ComponentType<RunsIndexBeforeAfterPanelProps> = dynamic(
  () => import("@/components/runs/RunsIndexBeforeAfterPanel").then((module) => module.RunsIndexBeforeAfterPanel),
  {
    ssr: false,
    loading: () => reviewsHubDeferredLoading("Loading review cycle delta"),
  },
);

type RunsListAggregateErrorBoundaryProps = RunsListClientProps;

export const RunsListAggregateErrorBoundaryDeferred: ComponentType<RunsListAggregateErrorBoundaryProps> =
  dynamic(
    () =>
      import("@/components/runs/RunsListAggregateErrorBoundary").then(
        (module) => module.RunsListAggregateErrorBoundary,
      ),
    {
      ssr: false,
      loading: () => reviewsHubDeferredLoading("Loading advanced review list"),
    },
  );
