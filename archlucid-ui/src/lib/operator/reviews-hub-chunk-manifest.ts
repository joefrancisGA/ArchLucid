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
] as const;
