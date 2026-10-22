import { cn } from "@/lib/utils";

import { GRAPH_MODE_NATIVE_TITLES } from "@/components/GraphIdleLegend";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { OPERATOR_GRAPH_SCOPE_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  graphScopeModeHrefFromSearch,
  OPERATOR_GRAPH_SCOPE_MODE_OPTIONS,
} from "@/lib/insights/graph-scope-mode-url";

import {
  GraphPageControlsLoadButton,
  GraphPageControlsReviewPicker,
} from "./GraphPageControlsBuyerShell";
import {
  shouldShowOperatorGraphModeFilters,
  type GraphPageControlModeFilterProps,
  type GraphPageControlShellProps,
} from "./use-graph-page-control-filters";

export function GraphPageControlsOperatorShell(props: GraphPageControlShellProps) {
  const {
    graphMainColumnMaxClass,
    runId,
    onRunIdChange,
    mode,
    demoUi,
    buyerPolishedShell,
    showLoadButton,
    loadButtonLabel,
    loading,
    onLoadGraph,
    onReviewsListAvailabilityChange,
    reviewPickerState,
    sampleGraphActive,
    compactEmptyWorkspace = false,
    pathname,
    currentSearch,
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
        "mb-6 flex flex-nowrap items-end gap-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        graphMainColumnMaxClass,
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
      />

      {shouldShowOperatorGraphModeFilters(demoUi, buyerPolishedShell, runTrim) ? (
        <GraphPageControlsModeFilter
          mode={mode}
          demoUi={demoUi}
          buyerPolishedShell={buyerPolishedShell}
          pathname={pathname}
          currentSearch={currentSearch}
          runTrim={runTrim}
        />
      ) : null}

      <GraphPageControlsLoadButton
        showLoadButton={showLoadButton}
        loading={loading}
        onLoadGraph={onLoadGraph}
        loadButtonLabel={loadButtonLabel}
        buyerPolishedShell={buyerPolishedShell}
        loadDisabled={loadDisabled}
        showSelectReviewHint={showSelectReviewHint}
        selectReviewHint="Select a review first."
      />
    </div>
  );
}

function GraphPageControlsModeFilter(props: GraphPageControlModeFilterProps) {
  const { mode, pathname, currentSearch } = props;

  return (
    <div className="min-w-[10rem] lg:w-auto">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)} id="graph-mode-select-label">
        {OPERATOR_GRAPH_SCOPE_LABEL}
      </p>

      <FilterChipGroup
        aria-labelledby="graph-mode-select-label"
        className="mt-1.5 flex max-w-md flex-wrap gap-2"
        data-testid="graph-mode-select"
      >
        {OPERATOR_GRAPH_SCOPE_MODE_OPTIONS.map((option) => (
          <FilterChip
            key={option.mode}
            href={graphScopeModeHrefFromSearch(currentSearch, option.mode, pathname)}
            scroll={false}
            className={buyerFilterChipClass(mode === option.mode, false)}
            aria-current={mode === option.mode ? "page" : undefined}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterChipGroup>

      <p className={cn("mt-1.5 max-w-md text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {GRAPH_MODE_NATIVE_TITLES[mode]}
      </p>
    </div>
  );
}
