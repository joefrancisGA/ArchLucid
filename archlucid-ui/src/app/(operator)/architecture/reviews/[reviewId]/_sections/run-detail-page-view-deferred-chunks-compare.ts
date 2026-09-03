"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const RunDetailCompareToBaselineCtaDeferred = createDeferredComponentFromManifest(
  "run-detail-compare-to-baseline-cta",
  { loadingClassName: "h-9 w-44" },
);

export const RunDetailWhatIfBranchCompareBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-what-if-branch-compare-banner",
  { suppressLoading: true },
);

export const BeforeAfterDeltaPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-before-after-delta-panel",
  { suppressLoading: true },
);

export const RecurrenceSchedulePostCommitCardDeferred = createDeferredComponentFromManifest(
  "run-detail-recurrence-schedule-post-commit-card",
  { suppressLoading: true },
);

/** Perf wave 10 — mid-band compare/savings leaves off sync First Load JS. */
export const ChangesSinceLastReviewBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-changes-since-last-review",
  { loadingClassName: "h-16" },
);

export const RunSavingsSummaryDeferred = createDeferredComponentFromManifest("run-detail-savings-summary", {
  loadingClassName: "h-24",
});

/** Perf wave 10 — decision-delta panel off sync First Load JS. */
export const RunDetailDecisionDeltaPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-decision-delta",
  { loadingClassName: "h-36" },
);
