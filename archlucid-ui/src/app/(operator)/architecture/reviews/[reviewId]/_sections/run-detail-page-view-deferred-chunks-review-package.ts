"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const RunDetailReviewPackageSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-section",
  { suppressLoading: true },
);

export const ReviewPackagePrimaryActionDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-primary-action",
  { suppressLoading: true },
);

export const ReviewPackageSponsorHandoffStripDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-sponsor-handoff-strip",
  { suppressLoading: true },
);

export const ReviewPackageDoThisNextStripDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-do-this-next-strip",
  { suppressLoading: true },
);

/** Perf wave 14 — review-package next-step resolver off sync First Load JS. */
export const RunDetailReviewPackageDoThisNextResolvedDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-do-this-next-resolved",
  { loadingClassName: "h-20" },
);

export const RunDetailReviewPackageSponsorHandoffGateDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-sponsor-handoff-gate",
  { suppressLoading: true },
);

/** TB-2142 — post-finalize share/export row off sync First Load JS. */
export const RunDetailReviewPackageShareRowDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-share-row",
  { suppressLoading: true },
);

export const RunDetailSponsorBottomLineDeferred = createDeferredComponentFromManifest(
  "run-detail-sponsor-bottom-line",
  { loadingClassName: "h-40" },
);

export const RunDetailSponsorReportCtaCardDeferred = createDeferredComponentFromManifest(
  "run-detail-sponsor-report-cta-card",
  { suppressLoading: true },
);

export const RunDetailSampleReviewPackageSummaryDeferred = createDeferredComponentFromManifest(
  "run-detail-sample-review-package-summary",
  { suppressLoading: true },
);

/** Perf wave 12 — sponsor walkthrough destination off sync First Load JS. */
export const GoldenSponsorPackageWalkthroughDestinationDeferred = createDeferredComponentFromManifest(
  "run-detail-golden-sponsor-walkthrough",
  { suppressLoading: true },
);
