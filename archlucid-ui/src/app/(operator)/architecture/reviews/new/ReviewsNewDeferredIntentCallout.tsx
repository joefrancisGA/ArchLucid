"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

/** Query-string intent callout — only relevant for clone/revised deep links. */
export const ReviewsNewDeferredIntentCallout = createDeferredComponentFromManifest("reviews-new-intent-callout", {
  suppressLoading: true,
});
