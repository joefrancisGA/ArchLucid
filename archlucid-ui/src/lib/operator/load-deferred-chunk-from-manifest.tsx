import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";
import {
  deferredChunkManifestEntry,
  type DeferredChunkManifestEntry,
} from "@/lib/operator/deferred-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";

export type LoadDeferredChunkFromManifestOptions = {
  readonly ssr?: boolean;
  readonly loadingClassName?: string;
  readonly loadingTestId?: string;
  readonly loadingWrapper?: (loading: JSX.Element) => JSX.Element;
  readonly suppressLoading?: boolean;
};

function requireDeferredChunkManifestEntry(entryId: string): DeferredChunkManifestEntry {
  const entry = deferredChunkManifestEntry(entryId);

  if (entry === undefined) {
    throw new Error(`Unknown deferred chunk manifest entry "${entryId}".`);
  }

  return entry;
}

/** Static import map so webpack can split deferred chunks predictably. */
function resolveDeferredChunkImportLoader(
  entryId: string,
): () => Promise<ComponentType<Record<string, unknown>>> {
  switch (entryId) {
    case "operator-home-command-center":
      return deferredChunkLoader(() =>
        import("@/components/usability/PilotCommandCenterCard").then(
          (module) => module.PilotCommandCenterCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-hero":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/BuyerPolishedHomeHeroSection").then(
          (module) => module.BuyerPolishedHomeHeroSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-gate":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeGate").then((module) => module.OperatorHomeGate),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-below-fold":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/_sections/OperatorHomeBelowFoldPanels").then(
          (module) => module.OperatorHomeBelowFoldPanels,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-stickiness":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeStickinessCockpit").then(
          (module) => module.OperatorHomeStickinessCockpit,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-sponsor-roi":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/OperatorHomeSponsorRoiStrip").then(
          (module) => module.OperatorHomeSponsorRoiStrip,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "operator-home-runs-dashboard":
      return deferredChunkLoader(() =>
        import("@/components/operator-home/RunsDashboardPanel").then(
          (module) => module.RunsDashboardPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-inventory":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory").then(
          (module) => module.ReviewsHubReviewInventory,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-welcome-onboarding":
      return deferredChunkLoader(() =>
        import("@/components/operator/OperatorWelcomeOnboarding").then(
          (module) => module.OperatorWelcomeOnboarding,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-explore-samples":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubExploreSamples").then(
          (module) => module.ReviewsHubExploreSamples,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-package-includes":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes").then(
          (module) => module.ReviewsHubPackageIncludes,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-before-after-delta":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubBeforeAfterDeltaPanel").then(
          (module) => module.ReviewsHubBeforeAfterDeltaPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-index-before-after":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunsIndexBeforeAfterPanel").then(
          (module) => module.RunsIndexBeforeAfterPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "reviews-hub-list-error-boundary":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunsListAggregateErrorBoundary").then(
          (module) => module.RunsListAggregateErrorBoundary,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-workspace-shell":
      return deferredChunkLoader(() =>
        import("@/components/reviews/ReviewWorkspaceShell").then((module) => module.ReviewWorkspaceShell),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-overview-panel":
      return deferredChunkLoader(() =>
        import("@/components/reviews/RunDetailOverviewPanelClient").then(
          (module) => module.RunDetailOverviewPanelClient,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-evidence-tab":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailEvidenceTabPanel").then(
          (module) => module.RunDetailEvidenceTabPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-below-fold":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBelowFoldSections").then(
          (module) => module.RunDetailBelowFoldSections,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-created-workspace":
      return deferredChunkLoader(() =>
        import("@/components/architecture/ArchitectureCreatedReviewWorkspaceShell").then(
          (module) => module.ArchitectureCreatedReviewWorkspaceShell,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-create-home-evidence":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeEvidencePanel").then(
          (module) => module.RunDetailCreateHomeEvidencePanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-create-home-activity":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeActivityPanel").then(
          (module) => module.RunDetailCreateHomeActivityPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-technology-baseline":
      return deferredChunkLoader(() =>
        import("@/components/reviews/technology-baseline/TechnologyBaselineSection").then(
          (module) => module.TechnologyBaselineSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-changes-since-last-review":
      return deferredChunkLoader(() =>
        import("@/components/ChangesSinceLastReviewBanner").then(
          (module) => module.ChangesSinceLastReviewBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-savings-summary":
      return deferredChunkLoader(() =>
        import("@/components/RunSavingsSummary").then((module) => module.RunSavingsSummary),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-decision-delta":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDecisionDeltaPanel").then(
          (module) => module.RunDetailDecisionDeltaPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-explanation-collapsible":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunExplanationCollapsible").then(
          (module) => module.RunDetailRunExplanationCollapsible,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-activity-sources":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailActivitySourcesPanel").then(
          (module) => module.RunDetailActivitySourcesPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-header":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome").then(
          (module) => module.RunDetailWorkspaceHeader,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-summary-strip":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceSummaryStripTabAware").then(
          (module) => module.RunDetailWorkspaceSummaryStripTabAware,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-blocking-banner":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome").then(
          (module) => module.RunDetailWorkspaceBlockingBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-workspace-sticky-actions":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceStickyActions").then(
          (module) => module.RunDetailWorkspaceStickyActions,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-section-nav":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailSectionNav").then((module) => module.RunDetailSectionNav),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-outcome-cards":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailOutcomeCards").then((module) => module.RunDetailOutcomeCards),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-artifacts-exports-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection").then(
          (module) => module.RunDetailArtifactsExportsSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-operator-technical-forensics":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailOperatorTechnicalForensicsPanel").then(
          (module) => module.RunDetailOperatorTechnicalForensicsPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-sponsor-bottom-line":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSponsorBottomLine").then(
          (module) => module.RunDetailSponsorBottomLine,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-do-this-next-resolved":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageDoThisNextResolved").then(
          (module) => module.RunDetailReviewPackageDoThisNextResolved,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-package-sponsor-handoff-gate":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageSponsorHandoffGate").then(
          (module) => module.RunDetailReviewPackageSponsorHandoffGate,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-help-page-situation-registrar":
      return deferredChunkLoader(() =>
        import("@/components/help/HelpPageSituationRegistrar").then(
          (module) => module.HelpPageSituationRegistrar,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-generation-created-notice":
      return deferredChunkLoader(() =>
        import("@/components/review-intake/ReviewGenerationCreatedNotice").then(
          (module) => module.ReviewGenerationCreatedNotice,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-progress-tracker":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunProgressTracker").then((module) => module.RunProgressTracker),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-estimated-llm-cost-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunEstimatedLlmCostCard").then((module) => module.RunEstimatedLlmCostCard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-capture-evidence-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCaptureEvidenceSection").then(
          (module) => module.RunDetailCaptureEvidenceSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-manifest-summary-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailManifestSummarySection").then(
          (module) => module.RunDetailManifestSummarySection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-agent-results-summary-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunAgentResultsSummaryCard").then(
          (module) => module.RunAgentResultsSummaryCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-review-agent-execution-log-section":
      return deferredChunkLoader(() =>
        import("@/components/reviews/ReviewAgentExecutionLogSection").then(
          (module) => module.ReviewAgentExecutionLogSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-retrieval-grounding-summary-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunRetrievalGroundingSummaryCard").then(
          (module) => module.RunRetrievalGroundingSummaryCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-run-metadata-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunMetadataSection").then(
          (module) => module.RunDetailRunMetadataSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-last-failure-card":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailLastFailureCard").then((module) => module.RunDetailLastFailureCard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-trust-evidence-card-section":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunTrustEvidenceCardSection").then(
          (module) => module.RunTrustEvidenceCardSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-sample-review-package-summary":
      return deferredChunkLoader(() =>
        import("@/components/SampleReviewPackageSummary").then((module) => module.SampleReviewPackageSummary),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-create-work-item-section":
      return deferredChunkLoader(() =>
        import("@/components/architecture/ArchitectureCreateWorkItemSection").then(
          (module) => module.ArchitectureCreateWorkItemSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-architecture-sponsor-sharing-panel":
      return deferredChunkLoader(() =>
        import("@/components/architecture/ArchitectureSponsorSharingPanel").then(
          (module) => module.ArchitectureSponsorSharingPanel,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-first-week-route-guidance":
      return deferredChunkLoader(() =>
        import("@/components/FirstWeekRouteGuidance").then((module) => module.FirstWeekRouteGuidance),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-cold-open-orientation":
      return deferredChunkLoader(() =>
        import("@/components/reviews/RunDetailColdOpenOrientationClient").then(
          (module) => module.RunDetailColdOpenOrientationClient,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-explanation-confidence-banner":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunExplanationConfidenceBanner").then(
          (module) => module.RunExplanationConfidenceBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-governance-alerts":
      return deferredChunkLoader(() =>
        import("@/components/reviews/RunDetailGovernanceAlerts").then((module) => module.RunDetailGovernanceAlerts),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-what-if-branch-compare-banner":
      return deferredChunkLoader(() =>
        import("@/components/draft-intake/WhatIfBranchCompareBanner").then(
          (module) => module.WhatIfBranchCompareBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-commit-blocking-findings-banner":
      return deferredChunkLoader(() =>
        import("@/components/usability/CommitBlockingFindingsBanner").then(
          (module) => module.CommitBlockingFindingsBanner,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-stalled-review-guidance-callout":
      return deferredChunkLoader(() =>
        import("@/components/usability/StalledReviewGuidanceCallout").then(
          (module) => module.StalledReviewGuidanceCallout,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-cto-demo-review-route-guard":
      return deferredChunkLoader(() =>
        import("@/components/cto-demo/CtoDemoReviewRouteGuard").then((module) => module.CtoDemoReviewRouteGuard),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-policy-pack-impact-callout":
      return deferredChunkLoader(() =>
        import("@/components/findings/ReviewDetailPolicyPackImpactSection").then(
          (module) => module.ReviewDetailPolicyPackImpactSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-tabbed-section-nav":
      return deferredChunkLoader(() =>
        import("@/components/runs/RunDetailTabbedSectionNav").then((module) => module.RunDetailTabbedSectionNav),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-before-after-delta-panel":
      return deferredChunkLoader(() =>
        import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-recurrence-schedule-post-commit-card":
      return deferredChunkLoader(() =>
        import("@/components/governance/RecurrenceSchedulePostCommitCard").then(
          (module) => module.RecurrenceSchedulePostCommitCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-retrieval-grounding-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRetrievalGroundingSection").then(
          (module) => module.RunDetailRetrievalGroundingSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-advanced-analysis-section":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAdvancedAnalysisSection").then(
          (module) => module.RunDetailAdvancedAnalysisSection,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    case "run-detail-sponsor-report-cta-card":
      return deferredChunkLoader(() =>
        import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailExecutiveSummaryCtaCard").then(
          (module) => module.RunDetailSponsorReportCtaCard,
        ),
      ) as () => Promise<ComponentType<Record<string, unknown>>>;
    default:
      throw new Error(`No deferred chunk import loader registered for manifest entry "${entryId}".`);
  }
}

/** TB-2371 — retry-aware dynamic import loader keyed by manifest entry id. */
export function loadDeferredChunkFromManifest(
  entryId: string,
): () => Promise<ComponentType<Record<string, unknown>>> {
  requireDeferredChunkManifestEntry(entryId);

  return resolveDeferredChunkImportLoader(entryId);
}

/** TB-2371 — `next/dynamic` wrapper driven by deferred chunk manifest metadata. */
export function createDeferredComponentFromManifest<P extends Record<string, unknown> = Record<string, unknown>>(
  entryId: string,
  options: LoadDeferredChunkFromManifestOptions = {},
): ComponentType<P> {
  const entry = requireDeferredChunkManifestEntry(entryId);
  const loader = loadDeferredChunkFromManifest(entryId);

  return dynamic(loader, {
    ssr: options.ssr ?? false,
    loading: options.suppressLoading
      ? () => null
      : () => {
          const loading = (
            <DeferredChunkLoading
              label={entry.label}
              variant={entry.variant}
              testId={options.loadingTestId ?? `${entry.id}-deferred-chunk-loading`}
              className={options.loadingClassName}
            />
          );

          if (options.loadingWrapper !== undefined) {
            return options.loadingWrapper(loading);
          }

          return loading;
        },
  }) as ComponentType<P>;
}

/** Operator-home manifest ids that have registered import loaders (manifest import-test guard). */
export const OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = OPERATOR_HOME_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Reviews-hub manifest ids that have registered import loaders (manifest import-test guard). */
export const REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = REVIEWS_HUB_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);

/** Run-detail manifest ids that have registered import loaders (manifest import-test guard). */
export const RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS: readonly string[] = RUN_DETAIL_CHUNK_MANIFEST.map(
  (entry) => entry.id,
);
