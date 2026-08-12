"use client";

import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { RunsIndexBeforeAfterPanelProps } from "@/components/runs/RunsIndexBeforeAfterPanel";
import type { RunsListClientProps } from "@/app/(operator)/architecture/reviews/RunsListClient";

function ReviewsHubDeferredSectionLoading(props: { readonly label: string }): JSX.Element {
  return (
    <div
      className={cn(
        "min-h-16 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label={props.label}
      data-testid="reviews-hub-deferred-chunk-loading"
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
    loading: () => <ReviewsHubDeferredSectionLoading label="Loading welcome guidance" />,
  },
);

export const ReviewsHubExploreSamplesDeferred: ComponentType = dynamic(
  () => import("./ReviewsHubExploreSamples").then((module) => module.ReviewsHubExploreSamples),
  {
    ssr: false,
    loading: () => <ReviewsHubDeferredSectionLoading label="Loading sample reviews" />,
  },
);

export const ReviewsHubPackageIncludesDeferred: ComponentType = dynamic(
  () => import("./ReviewsHubPackageIncludes").then((module) => module.ReviewsHubPackageIncludes),
  {
    ssr: false,
    loading: () => <ReviewsHubDeferredSectionLoading label="Loading package includes" />,
  },
);

export const ReviewsHubBeforeAfterDeltaPanelDeferred: ComponentType = dynamic(
  () =>
    import("./ReviewsHubBeforeAfterDeltaPanel").then((module) => module.ReviewsHubBeforeAfterDeltaPanel),
  {
    ssr: false,
    loading: () => <ReviewsHubDeferredSectionLoading label="Loading review delta" />,
  },
);

export const RunsIndexBeforeAfterPanelDeferred: ComponentType<RunsIndexBeforeAfterPanelProps> = dynamic(
  () => import("@/components/runs/RunsIndexBeforeAfterPanel").then((module) => module.RunsIndexBeforeAfterPanel),
  {
    ssr: false,
    loading: () => <ReviewsHubDeferredSectionLoading label="Loading review cycle delta" />,
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
      loading: () => <ReviewsHubDeferredSectionLoading label="Loading advanced review list" />,
    },
  );
