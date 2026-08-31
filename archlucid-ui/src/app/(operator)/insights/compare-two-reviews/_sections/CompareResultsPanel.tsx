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
};

export function CompareResultsPanel(props: CompareResultsPanelProps) {
  const viewModel = useCompareResultsPanel(props);
  const { resultsRegionRef, resultsFirst = false } = viewModel;

  return (
    <section
      ref={resultsRegionRef}
      tabIndex={-1}
      className={cn("space-y-4 outline-none", resultsFirst && "order-1")}
      aria-label="Comparison results"
      data-testid="compare-results-region"
    >
      <CompareResultsPanelVerdictChrome viewModel={viewModel} />
      <CompareResultsPanelDiffStack viewModel={viewModel} />
    </section>
  );
}
