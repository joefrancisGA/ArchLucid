import { cn } from "@/lib/utils";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";

import { GRAPH_MODE_NATIVE_TITLES } from "@/components/GraphIdleLegend";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";

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
  OPERATOR_GRAPH_SCOPE_LABEL,
} from "@/lib/buyer/buyer-polish-copy";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  graphScopeModeHrefFromSearch,
  OPERATOR_GRAPH_SCOPE_MODE_OPTIONS,
} from "@/lib/insights/graph-scope-mode-url";

import type { GraphReviewPickerState } from "@/lib/graph-page-state";

import type { AskRunListAvailability } from "@/lib/graph-page-state";

import type { GraphMode } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";

export type GraphPageControlsProps = {

  graphMainColumnMaxClass: string;

  runId: string;

  onRunIdChange: (value: string) => void;

  mode: GraphMode;

  onModeChange: (mode: GraphMode) => void;

  demoUi: boolean;

  buyerPolishedShell: boolean;

  showLoadButton: boolean;

  loadButtonLabel: string;

  loading: boolean;

  onLoadGraph: () => void;

  decisionId: string;

  nodeId: string;

  onReviewsListAvailabilityChange?: (state: AskRunListAvailability) => void;

  reviewPickerState: GraphReviewPickerState;

  sampleGraphActive: boolean;
  showPresentationTabs: boolean;
  /** When true, demote the review picker below the empty-state card (no completed packages). */
  compactEmptyWorkspace?: boolean;
};

export function GraphPageControls(props: GraphPageControlsProps) {

  const {

    graphMainColumnMaxClass,

    runId,

    onRunIdChange,

    mode,

    onModeChange,

    demoUi,

    buyerPolishedShell,

    showLoadButton,

    loadButtonLabel,

    loading,

    onLoadGraph,

    decisionId,

    nodeId,

    onReviewsListAvailabilityChange,

    reviewPickerState,

    sampleGraphActive,
    showPresentationTabs,
    compactEmptyWorkspace = false,
  } = props;

  const pathname = usePathname() ?? EVIDENCE_GRAPH_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const runTrim = runId.trim();
  const scopedRunFilterActive = runTrim.length > 0;
  const graphClearScopeHref = EVIDENCE_GRAPH_PATH;

  const loadDisabled =

    loading ||

    runTrim.length === 0 ||

    (mode === "decision-subgraph" && decisionId.trim().length === 0) ||

    (mode === "node-neighborhood" && nodeId.trim().length === 0);

  const showSelectReviewHint =
    showLoadButton &&
    runTrim.length === 0 &&
    !loading &&
    reviewPickerState === "no-selection";

  const reviewPackageHref =

    runTrim.length > 0 ? `/architecture/reviews/${encodeURIComponent(runTrim)}` : "/architecture/reviews";

  if (buyerPolishedShell) {

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
          {scopedRunFilterActive ? (
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
          ) : (
            <div className={cn("min-w-[14rem] flex-1", compactEmptyWorkspace ? "lg:max-w-lg" : "lg:max-w-md")}>
              <AskRunIdPicker
                value={runId}
                onChange={onRunIdChange}
                selectedThreadId=""
                fieldId="graph-run"
                label="Review"
                committedOnly
                preferAutoPick={false}
                autoSelectSyntheticSample={false}
                hideFieldHelper
                reviewsLoadErrorPlaceholder={BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_PLACEHOLDER}
                reviewsLoadErrorHint={BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_HINT}
                syntheticSampleHint={BUYER_EVIDENCE_GRAPH_SYNTHETIC_SAMPLE_HINT}
                syntheticLoadErrorHint={BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT}
                emptyListPlaceholder={BUYER_EVIDENCE_GRAPH_EMPTY_LIST_PLACEHOLDER}
                emptyListHint={BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT}
                onListAvailabilityChange={onReviewsListAvailabilityChange}
              />
              {reviewPickerState !== "no-packages" &&
              !compactEmptyWorkspace &&
              !(sampleGraphActive && reviewPickerState === "sample-review") ? (
                <GraphReviewPickerStatus state={reviewPickerState} className="mt-2" />
              ) : null}
            </div>
          )}

          {showLoadButton ? (

            <div className="flex flex-col gap-1">

              <Button

                type="button"

                variant="primary"

                disabled={loadDisabled}

                onClick={() => void onLoadGraph()}

              >

                {loading ? "Loading…" : BUYER_EVIDENCE_TRAIL_LOAD_BUTTON}

              </Button>

              {showSelectReviewHint ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  Select a completed review, then load its evidence graph.
                </p>
              ) : null}

            </div>

          ) : null}

        </div>

        {showPresentationTabs ? (
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
        ) : null}

      </div>

    );

  }

  return (

    <div

      className={cn(

        "mb-6 flex flex-nowrap items-end gap-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",

        graphMainColumnMaxClass,

      )}

    >

      {scopedRunFilterActive ? (
        <p
          className={cn("m-0 min-w-[12rem] flex-1 text-al-text-secondary lg:max-w-sm", OPERATOR_TYPOGRAPHY.body)}
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
      ) : (
        <div className="min-w-[12rem] flex-1 lg:max-w-sm">
          <AskRunIdPicker
            value={runId}
            onChange={onRunIdChange}
            selectedThreadId=""
            fieldId="graph-run"
            label="Review"
            committedOnly
            preferAutoPick={false}
            autoSelectSyntheticSample={false}
            onListAvailabilityChange={onReviewsListAvailabilityChange}
          />
        </div>
      )}

      {!(demoUi || buyerPolishedShell) && runTrim.length > 0 ? (

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

      ) : null}

      {showLoadButton ? (

        <div className="flex flex-col gap-1">

          <Button

            type="button"

            variant="primary"

            className="w-full lg:w-auto"

            onClick={() => void onLoadGraph()}

            disabled={loadDisabled}

          >

            {loadButtonLabel}

          </Button>

          {showSelectReviewHint ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Select a review first.
            </p>
          ) : null}

        </div>

      ) : null}

    </div>

  );

}

