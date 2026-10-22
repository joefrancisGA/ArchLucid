import { cn } from "@/lib/utils";

import Link from "next/link";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GraphReviewPickerStatus } from "@/app/(operator)/insights/evidence-graph/_sections/GraphReviewPickerStatus";
import {
  BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT,
  BUYER_EVIDENCE_GRAPH_EMPTY_LIST_PLACEHOLDER,
  BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT,
  BUYER_EVIDENCE_GRAPH_SYNTHETIC_SAMPLE_HINT,
  BUYER_EVIDENCE_TRAIL_LOAD_BUTTON,
  BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE,
  BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_HINT,
  BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_PLACEHOLDER,
  BUYER_EVIDENCE_TRAIL_VIEW_GRAPH,
  BUYER_EVIDENCE_TRAIL_VIEW_TRACE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  shouldShowGraphReviewPickerStatus,
  type GraphPageControlLoadButtonProps,
  type GraphPageControlPickerProps,
  type GraphPageControlPresentationTabsProps,
  type GraphPageControlShellProps,
} from "./use-graph-page-control-filters";

export function GraphPageControlsBuyerShell(props: GraphPageControlShellProps) {
  const {
    graphMainColumnMaxClass,
    runId,
    onRunIdChange,
    buyerPolishedShell,
    showLoadButton,
    loading,
    onLoadGraph,
    onReviewsListAvailabilityChange,
    reviewPickerState,
    sampleGraphActive,
    showPresentationTabs,
    compactEmptyWorkspace = false,
    runTrim,
    scopedRunFilterActive,
    graphClearScopeHref,
    reviewPackageHref,
    loadDisabled,
    showSelectReviewHint,
  } = props;

  return (
    <div
      className={cn(
        compactEmptyWorkspace ? "mb-0 space-y-2" : "mb-3 space-y-2",
        graphMainColumnMaxClass,
      )}
      data-testid="graph-page-controls-buyer"
    >
      <div
        className={cn(
          "flex flex-wrap items-end gap-3",
          compactEmptyWorkspace &&
            "rounded-md border border-neutral-200/80 bg-neutral-50/60 p-2 opacity-90 dark:border-neutral-800 dark:bg-neutral-900/40",
        )}
      >
        <GraphPageControlsReviewPicker
          runId={runId}
          onRunIdChange={onRunIdChange}
          onReviewsListAvailabilityChange={onReviewsListAvailabilityChange}
          reviewPickerState={reviewPickerState}
          sampleGraphActive={sampleGraphActive}
          compactEmptyWorkspace={compactEmptyWorkspace}
          runTrim={runTrim}
          scopedRunFilterActive={scopedRunFilterActive}
          graphClearScopeHref={graphClearScopeHref}
          reviewPackageHref={reviewPackageHref}
          buyerPolishedShell={buyerPolishedShell}
        />

        {showLoadButton ? (
          <GraphPageControlsLoadButton
            showLoadButton={showLoadButton}
            loading={loading}
            onLoadGraph={onLoadGraph}
            loadButtonLabel={BUYER_EVIDENCE_TRAIL_LOAD_BUTTON}
            buyerPolishedShell={buyerPolishedShell}
            loadDisabled={loadDisabled}
            showSelectReviewHint={showSelectReviewHint}
            selectReviewHint="Select a completed review, then load its evidence graph."
          />
        ) : null}
      </div>

      {showPresentationTabs ? (
        <GraphPageControlsPresentationTabs
          showPresentationTabs={showPresentationTabs}
          sampleGraphActive={sampleGraphActive}
          runTrim={runTrim}
          reviewPackageHref={reviewPackageHref}
        />
      ) : null}
    </div>
  );
}

function GraphPageControlsReviewPicker(
  props: GraphPageControlPickerProps & { readonly buyerPolishedShell?: boolean },
) {
  const {
    runId,
    onRunIdChange,
    onReviewsListAvailabilityChange,
    reviewPickerState,
    sampleGraphActive,
    compactEmptyWorkspace = false,
    runTrim,
    scopedRunFilterActive,
    graphClearScopeHref,
    reviewPackageHref,
    buyerPolishedShell = false,
  } = props;

  if (scopedRunFilterActive) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="evidence-graph-run-scope-banner"
      >
        {"Inspecting evidence graph for review "}
        <span className="font-mono text-al-text-primary">{runTrim}</span>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={graphClearScopeHref}>
          Clear review scope
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={reviewPackageHref}>
          Open review
        </Link>
      </p>
    );
  }

  return (
    <div className={cn("min-w-[14rem] flex-1", compactEmptyWorkspace ? "lg:max-w-lg" : buyerPolishedShell ? "lg:max-w-md" : "lg:max-w-sm")}>
      <AskRunIdPicker
        value={runId}
        onChange={onRunIdChange}
        selectedThreadId=""
        fieldId="graph-run"
        label="Review"
        committedOnly
        preferAutoPick={false}
        autoSelectSyntheticSample={false}
        hideFieldHelper={buyerPolishedShell}
        reviewsLoadErrorPlaceholder={buyerPolishedShell ? BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_PLACEHOLDER : undefined}
        reviewsLoadErrorHint={buyerPolishedShell ? BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_HINT : undefined}
        syntheticSampleHint={buyerPolishedShell ? BUYER_EVIDENCE_GRAPH_SYNTHETIC_SAMPLE_HINT : undefined}
        syntheticLoadErrorHint={buyerPolishedShell ? BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT : undefined}
        emptyListPlaceholder={buyerPolishedShell ? BUYER_EVIDENCE_GRAPH_EMPTY_LIST_PLACEHOLDER : undefined}
        emptyListHint={buyerPolishedShell ? BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT : undefined}
        onListAvailabilityChange={onReviewsListAvailabilityChange}
      />
      {buyerPolishedShell &&
      shouldShowGraphReviewPickerStatus(reviewPickerState, compactEmptyWorkspace, sampleGraphActive) ? (
        <GraphReviewPickerStatus state={reviewPickerState} className="mt-2" />
      ) : null}
    </div>
  );
}

function GraphPageControlsLoadButton(
  props: GraphPageControlLoadButtonProps & {
    readonly selectReviewHint: string;
  },
) {
  const {
    showLoadButton,
    loading,
    onLoadGraph,
    loadButtonLabel,
    buyerPolishedShell,
    loadDisabled,
    showSelectReviewHint,
    selectReviewHint,
  } = props;

  if (!showLoadButton) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="primary"
        className={buyerPolishedShell ? undefined : "w-full lg:w-auto"}
        disabled={loadDisabled}
        onClick={() => void onLoadGraph()}
      >
        {loading ? "Loading…" : loadButtonLabel}
      </Button>

      {showSelectReviewHint ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{selectReviewHint}</p>
      ) : null}
    </div>
  );
}

function GraphPageControlsPresentationTabs(props: GraphPageControlPresentationTabsProps) {
  const { runTrim, reviewPackageHref, sampleGraphActive } = props;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <TabsList aria-label="Evidence graph view" data-testid="graph-presentation-tabs">
          <TabsTrigger value="graph" data-testid="graph-presentation-tab-graph" className="shrink-0">
            {BUYER_EVIDENCE_TRAIL_VIEW_GRAPH}
          </TabsTrigger>
          <TabsTrigger value="trace" data-testid="graph-presentation-tab-trace" className="shrink-0">
            {BUYER_EVIDENCE_TRAIL_VIEW_TRACE}
          </TabsTrigger>
        </TabsList>
        {runTrim.length > 0 && !sampleGraphActive ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={reviewPackageHref}>{BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { GraphPageControlsReviewPicker, GraphPageControlsLoadButton, GraphPageControlsPresentationTabs };
