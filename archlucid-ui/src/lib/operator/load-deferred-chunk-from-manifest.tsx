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
