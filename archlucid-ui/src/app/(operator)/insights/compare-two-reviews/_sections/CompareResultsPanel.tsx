"use client";

import { cn } from "@/lib/utils";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ComparisonExplanation } from "@/types/explanation";
import type { RunComparison, RunSummary } from "@/types/authority";
import type { ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { CompareResultsPanelDiffStack } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack";
import { CompareResultsPanelVerdictChrome } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome";
import { useCompareResultsPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-results-panel";
import { comparisonDriftReportBlockedReason } from "@/lib/compare/comparison-drift-blocked-reason";
import { comparisonSearchBlockedReason } from "@/lib/compare/comparison-search-blocked-reason";
import { CompareResultsPanelPartialInventoryFootnote } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelPartialInventoryFootnote";
import { COMPARE_SEARCH_BLOCKED_NOT_EMPTY_COMPARE_LINE } from "@/lib/architecture/compare-search-blocked-not-empty-compare-copy";
import { COMPARE_DRIFT_DOWNLOAD_BLOCKED_NOT_EMPTY_COMPARE_LINE } from "@/lib/architecture/compare-drift-download-blocked-not-empty-compare-copy";
import { COMPARE_DRIFT_DOWNLOAD_HARD_FAILURE_NOT_EMPTY_ARTIFACT_LINE } from "@/lib/architecture/compare-drift-download-hard-failure-not-empty-artifact-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareResultsPanelProps = {
  showStaleInputsWarning: boolean;
  lastComparedPair: ComparedPair | null;
  leftPickedSummary: RunSummary | null;
  rightPickedSummary: RunSummary | null;
  loading: boolean;
  leftTrim: string;
  rightTrim: string;
  aiLoading: boolean;
  legacyFailure: ApiLoadFailureState | null;
  legacyMalformed: string | null;
  goldenFailure: ApiLoadFailureState | null;
  goldenMalformed: string | null;
  aiFailure: ApiLoadFailureState | null;
  aiMalformed: string | null;
  hasResultsToNavigate: boolean;
  golden: GoldenManifestComparison | null;
  result: RunComparison | null;
  aiExplanation: ComparisonExplanation | null;
  comparisonNarrative: string | null;
  comparisonNarrativeLoading: boolean;
  /** Buyer shell: softer labels, collapsed technical outline, collapsed structured folds by default. */
  buyerPolished?: boolean;
  /** Places results above collapsed pickers in buyer insight-first layout. */
  resultsFirst?: boolean;
  /** Show SecureNow partial-inventory footnote when comparison output is present. */
  showPartialInventoryFootnote?: boolean;
  leftSummaryBlockedReason?: string | null;
  rightSummaryBlockedReason?: string | null;
};

export function CompareResultsPanel(props: CompareResultsPanelProps) {
  const viewModel = useCompareResultsPanel(props);
  const {
    resultsRegionRef,
    comparisonSearchBlockedReason: searchBlockedReason,
    comparisonDriftBlockedReason: driftBlockedReason,
    comparisonDriftDownload,
  } = viewModel;
  const driftHardFailure =
    comparisonDriftDownload.failure !== null && driftBlockedReason === null;
  const resultsFirst = props.resultsFirst ?? false;
  const showPartialInventoryFootnote = props.showPartialInventoryFootnote ?? false;

  return (
    <section
      ref={resultsRegionRef}
      tabIndex={-1}
      className={cn("space-y-4 outline-none", resultsFirst && "order-1")}
      aria-label="Comparison results"
      data-testid="compare-results-region"
    >
      {searchBlockedReason ? (
        <div className="space-y-1">
          <p className="m-0 text-sm text-al-text-secondary" data-testid="compare-search-blocked-reason">
            {searchBlockedReason}
          </p>
          <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-search-blocked-not-empty-compare">
            {COMPARE_SEARCH_BLOCKED_NOT_EMPTY_COMPARE_LINE}
          </p>
        </div>
      ) : null}
      {driftBlockedReason ? (
        <div className="space-y-1">
          <p className="m-0 text-sm text-al-text-secondary" data-testid="compare-drift-blocked-reason">
            {driftBlockedReason}
          </p>
          <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-drift-download-blocked-not-empty-compare">
            {COMPARE_DRIFT_DOWNLOAD_BLOCKED_NOT_EMPTY_COMPARE_LINE}
          </p>
        </div>
      ) : null}
      {driftHardFailure ? (
        <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-drift-download-hard-failure-not-empty-artifact">
          {COMPARE_DRIFT_DOWNLOAD_HARD_FAILURE_NOT_EMPTY_ARTIFACT_LINE}
        </p>
      ) : null}
      <CompareResultsPanelPartialInventoryFootnote visible={showPartialInventoryFootnote} />
      <CompareResultsPanelVerdictChrome viewModel={viewModel} />
      <CompareResultsPanelDiffStack viewModel={viewModel} />
    </section>
  );
}
