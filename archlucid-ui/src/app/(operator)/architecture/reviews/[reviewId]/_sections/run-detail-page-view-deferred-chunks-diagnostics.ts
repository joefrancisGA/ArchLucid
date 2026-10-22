"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const RunDetailHolisticCriticPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-holistic-critic-panel",
  { suppressLoading: true },
);

export const RunDetailEstimatedLlmCostCardDeferred = createDeferredComponentFromManifest(
  "run-detail-estimated-llm-cost-card",
  { suppressLoading: true },
);

export const RunDetailAgentResultsSummaryCardDeferred = createDeferredComponentFromManifest(
  "run-detail-agent-results-summary-card",
  { suppressLoading: true },
);

export const RunDetailReviewAgentExecutionLogSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-review-agent-execution-log-section",
  { suppressLoading: true },
);

export const RunDetailRunMetadataSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-run-metadata-section",
  { suppressLoading: true },
);

export const RunDetailLastFailureCardDeferred = createDeferredComponentFromManifest(
  "run-detail-last-failure-card",
  { suppressLoading: true },
);

export const RunDetailProgressTrackerDeferred = createDeferredComponentFromManifest(
  "run-detail-progress-tracker",
  { suppressLoading: true },
);

export const RunDetailOperatorTechnicalForensicsPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-operator-technical-forensics",
  { suppressLoading: true },
);

export const RunDetailAdvancedAnalysisSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-advanced-analysis-section",
  { suppressLoading: true },
);

/** Activity-tab / details-gated outcome cards — not needed for first paint (TB-933). */
export const RunDetailOutcomeCardsDeferred = createDeferredComponentFromManifest("run-detail-outcome-cards", {
  loadingClassName: "h-40",
});

/** Perf wave 10 — findings/explanation collapsible off sync First Load JS. */
export const RunDetailRunExplanationCollapsibleDeferred = createDeferredComponentFromManifest(
  "run-detail-explanation-collapsible",
  { loadingClassName: "h-48" },
);

export const HelpPageSituationRegistrarDeferred = createDeferredComponentFromManifest(
  "run-detail-help-page-situation-registrar",
  { suppressLoading: true },
);

export const ReviewGenerationCreatedNoticeDeferred = createDeferredComponentFromManifest(
  "run-detail-review-generation-created-notice",
  { suppressLoading: true },
);

export const RunDetailRunActionsSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-run-actions-section",
  { suppressLoading: true },
);

export const RunDetailStalledReviewGuidanceCalloutDeferred = createDeferredComponentFromManifest(
  "run-detail-stalled-review-guidance-callout",
  { suppressLoading: true },
);
