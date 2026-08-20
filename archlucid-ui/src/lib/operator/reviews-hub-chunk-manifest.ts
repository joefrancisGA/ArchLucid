import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — reviews hub deferred chunk catalog. */
export const REVIEWS_HUB_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "reviews-hub-inventory",
    label: "Loading reviews inventory",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory",
    exportName: "ReviewsHubReviewInventory",
  },
  {
    id: "reviews-hub-welcome-onboarding",
    label: "Loading welcome guidance",
    variant: "compact",
    modulePath: "@/components/operator/OperatorWelcomeOnboarding",
    exportName: "OperatorWelcomeOnboarding",
  },
  {
    id: "reviews-hub-explore-samples",
    label: "Loading sample reviews",
    variant: "compact",
    modulePath: "@/app/(operator)/architecture/reviews/_sections/ReviewsHubExploreSamples",
    exportName: "ReviewsHubExploreSamples",
  },
  {
    id: "reviews-hub-package-includes",
    label: "Loading what each review contains",
    variant: "compact",
    modulePath: "@/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes",
    exportName: "ReviewsHubPackageIncludes",
  },
  {
    id: "reviews-hub-before-after-delta",
    label: "Loading review delta",
    variant: "compact",
    modulePath: "@/app/(operator)/architecture/reviews/_sections/ReviewsHubBeforeAfterDeltaPanel",
    exportName: "ReviewsHubBeforeAfterDeltaPanel",
  },
  {
    id: "reviews-hub-index-before-after",
    label: "Loading review cycle delta",
    variant: "compact",
    modulePath: "@/components/runs/RunsIndexBeforeAfterPanel",
    exportName: "RunsIndexBeforeAfterPanel",
  },
  {
    id: "reviews-hub-list-error-boundary",
    label: "Loading advanced review list",
    variant: "compact",
    modulePath: "@/components/runs/RunsListAggregateErrorBoundary",
    exportName: "RunsListAggregateErrorBoundary",
  },
] as const;
