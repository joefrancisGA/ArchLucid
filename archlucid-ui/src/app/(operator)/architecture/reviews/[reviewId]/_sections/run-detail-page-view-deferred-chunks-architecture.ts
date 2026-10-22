"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

/** TB-2021 remainder — create-home workspace off sync First Load JS. */
export const RunDetailArchitectureCreatedWorkspaceDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-created-workspace",
  { suppressLoading: true },
);

export const RunDetailArchitectureCreateWorkItemSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-create-work-item-section",
  { suppressLoading: true },
);

export const RunDetailArchitectureSponsorSharingPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-sponsor-sharing-panel",
  { suppressLoading: true },
);

export const RunDetailFirstWeekRouteGuidanceDeferred = createDeferredComponentFromManifest(
  "run-detail-first-week-route-guidance",
  { suppressLoading: true },
);

export const RunDetailColdOpenOrientationDeferred = createDeferredComponentFromManifest(
  "run-detail-cold-open-orientation",
  { suppressLoading: true },
);

export const RunDetailExplanationConfidenceBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-explanation-confidence-banner",
  { suppressLoading: true },
);

export const RunDetailSubmittedArchitectureSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-submitted-architecture-section",
  { suppressLoading: true },
);

export const RunDetailManifestSummarySectionDeferred = createDeferredComponentFromManifest(
  "run-detail-manifest-summary-section",
  { suppressLoading: true },
);

export const RunDetailManifestSummaryAlertsDeferred = createDeferredComponentFromManifest(
  "run-detail-manifest-summary-alerts",
  { suppressLoading: true },
);
