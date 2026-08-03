"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const technologyBaselineLoading = (
  <section id="technology-baseline" className="scroll-mt-24">
    <div
      className="h-28 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading technology baseline"
    />
  </section>
);

export const RunDetailTechnologyBaselineSection = dynamic(
  () =>
    import("@/components/reviews/technology-baseline/TechnologyBaselineSection").then(
      (module) => module.TechnologyBaselineSection,
    ),
  { ssr: false, loading: () => technologyBaselineLoading },
);

export const RunDetailHolisticCriticPanelDeferred = dynamic(
  () => import("./RunDetailHolisticCriticPanel").then((module) => module.RunDetailHolisticCriticPanel),
  { ssr: false, loading: () => null },
);

export const RunDetailExportDeliverableDialog = dynamic(
  () =>
    import("@/components/usability/ExportDeliverableDialog").then(
      (module) => module.ExportDeliverableDialog,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailGenerateAdrFromRunModal = dynamic(
  () => import("@/components/GenerateAdrFromRunModal").then((module) => module.GenerateAdrFromRunModal),
  { ssr: false, loading: () => null },
);

export const RunDetailCompareToBaselineCta = dynamic(
  () => import("@/components/CompareToBaselineCta").then((module) => module.CompareToBaselineCta),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn("h-9 w-44 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        aria-label="Loading compare to baseline"
      />
    ),
  },
);

export const RunDetailEstimatedLlmCostCardDeferred = dynamic(
  () => import("@/components/RunEstimatedLlmCostCard").then((module) => module.RunEstimatedLlmCostCard),
  { ssr: false, loading: () => null },
);

export const RunDetailAgentResultsSummaryCardDeferred = dynamic(
  () => import("@/components/RunAgentResultsSummaryCard").then((module) => module.RunAgentResultsSummaryCard),
  { ssr: false, loading: () => null },
);

export const RunDetailReviewAgentExecutionLogSectionDeferred = dynamic(
  () =>
    import("@/components/reviews/ReviewAgentExecutionLogSection").then(
      (module) => module.ReviewAgentExecutionLogSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailRetrievalGroundingSummaryCardDeferred = dynamic(
  () =>
    import("@/components/RunRetrievalGroundingSummaryCard").then(
      (module) => module.RunRetrievalGroundingSummaryCard,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailRunMetadataSectionDeferred = dynamic(
  () =>
    import("./RunDetailRunMetadataSection").then((module) => module.RunDetailRunMetadataSection),
  { ssr: false, loading: () => null },
);

export const RunDetailLastFailureCardDeferred = dynamic(
  () => import("@/components/RunDetailLastFailureCard").then((module) => module.RunDetailLastFailureCard),
  { ssr: false, loading: () => null },
);

export const RunDetailProgressTrackerDeferred = dynamic(
  () => import("@/components/RunProgressTracker").then((module) => module.RunProgressTracker),
  { ssr: false, loading: () => null },
);

export const RunDetailTrustEvidenceCardSectionDeferred = dynamic(
  () =>
    import("@/components/RunTrustEvidenceCardSection").then((module) => module.RunTrustEvidenceCardSection),
  { ssr: false, loading: () => null },
);

export const RunDetailSampleReviewPackageSummaryDeferred = dynamic(
  () => import("@/components/SampleReviewPackageSummary").then((module) => module.SampleReviewPackageSummary),
  { ssr: false, loading: () => null },
);

export const RunDetailArchitectureCreatedWorkspaceDeferred = dynamic(
  () =>
    import("@/components/architecture/ArchitectureCreatedWorkspace").then(
      (module) => module.ArchitectureCreatedWorkspace,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailArchitectureCreateWorkItemSectionDeferred = dynamic(
  () =>
    import("@/components/architecture/ArchitectureCreateWorkItemSection").then(
      (module) => module.ArchitectureCreateWorkItemSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailArchitectureSponsorSharingPanelDeferred = dynamic(
  () =>
    import("@/components/architecture/ArchitectureSponsorSharingPanel").then(
      (module) => module.ArchitectureSponsorSharingPanel,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailFirstWeekRouteGuidanceDeferred = dynamic(
  () => import("@/components/FirstWeekRouteGuidance").then((module) => module.FirstWeekRouteGuidance),
  { ssr: false, loading: () => null },
);

export const RunDetailExplanationConfidenceBannerDeferred = dynamic(
  () =>
    import("@/components/RunExplanationConfidenceBanner").then(
      (module) => module.RunExplanationConfidenceBanner,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailGovernanceAlertsDeferred = dynamic(
  () =>
    import("@/components/reviews/RunDetailGovernanceAlerts").then(
      (module) => module.RunDetailGovernanceAlerts,
    ),
  { ssr: false, loading: () => null },
);

const outcomeCardsLoading = (
  <div
    className="h-40 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading outcome cards"
  />
);

/** Activity-tab / details-gated outcome cards — not needed for first paint (TB-933). */
export const RunDetailOutcomeCardsDeferred = dynamic(
  () => import("@/components/RunDetailOutcomeCards").then((module) => module.RunDetailOutcomeCards),
  { ssr: false, loading: () => outcomeCardsLoading },
);

export const RunDetailWhatIfBranchCompareBannerDeferred = dynamic(
  () =>
    import("@/components/draft-intake/WhatIfBranchCompareBanner").then(
      (module) => module.WhatIfBranchCompareBanner,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailCommitBlockingFindingsBannerDeferred = dynamic(
  () =>
    import("@/components/usability/CommitBlockingFindingsBanner").then(
      (module) => module.CommitBlockingFindingsBanner,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailStalledReviewGuidanceCalloutDeferred = dynamic(
  () =>
    import("@/components/usability/StalledReviewGuidanceCallout").then(
      (module) => module.StalledReviewGuidanceCallout,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailCtoDemoReviewRouteGuardDeferred = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoReviewRouteGuard").then(
      (module) => module.CtoDemoReviewRouteGuard,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailPolicyPackImpactCalloutDeferred = dynamic(
  () =>
    import("@/components/findings/ReviewDetailPolicyPackImpactCallout").then(
      (module) => module.ReviewDetailPolicyPackImpactCallout,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailOperatorTechnicalForensicsPanelDeferred = dynamic(
  () =>
    import("./RunDetailOperatorTechnicalForensicsPanel").then(
      (module) => module.RunDetailOperatorTechnicalForensicsPanel,
    ),
  { ssr: false, loading: () => null },
);

const artifactsExportsLoading = (
  <section id="artifacts-exports" className="scroll-mt-24">
    <div
      className="h-36 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading artifacts and exports"
    />
  </section>
);

/** TB-2021 — export button cluster is tab/Evidence-gated; keep off sync First Load JS. */
export const RunDetailArtifactsExportsSectionDeferred = dynamic(
  () =>
    import("./RunDetailArtifactsExportsSection").then(
      (module) => module.RunDetailArtifactsExportsSection,
    ),
  { ssr: false, loading: () => artifactsExportsLoading },
);
