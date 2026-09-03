"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import type { GraphReviewPickerState } from "@/lib/graph-page-state";

import type { GraphMode } from "./graph-page-helpers";
import type { GraphPageControlsProps } from "./GraphPageControls";

export type GraphPageControlFilterState = {
  readonly pathname: string;
  readonly currentSearch: string;
  readonly runTrim: string;
  readonly scopedRunFilterActive: boolean;
  readonly graphClearScopeHref: string;
  readonly reviewPackageHref: string;
  readonly loadDisabled: boolean;
  readonly showSelectReviewHint: boolean;
};

/** Derived filter, scope, and layout-toggle state for evidence-graph page controls. */
export function useGraphPageControlFilters(props: GraphPageControlsProps): GraphPageControlFilterState {
  const pathname = usePathname() ?? EVIDENCE_GRAPH_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const runTrim = props.runId.trim();
  const scopedRunFilterActive = runTrim.length > 0;
  const graphClearScopeHref = EVIDENCE_GRAPH_PATH;

  const loadDisabled =
    props.loading ||
    runTrim.length === 0 ||
    (props.mode === "decision-subgraph" && props.decisionId.trim().length === 0) ||
    (props.mode === "node-neighborhood" && props.nodeId.trim().length === 0);

  const showSelectReviewHint =
    props.showLoadButton &&
    runTrim.length === 0 &&
    !props.loading &&
    props.reviewPickerState === "no-selection";

  const reviewPackageHref =
    runTrim.length > 0 ? `/architecture/reviews/${encodeURIComponent(runTrim)}` : "/architecture/reviews";

  return {
    pathname,
    currentSearch,
    runTrim,
    scopedRunFilterActive,
    graphClearScopeHref,
    reviewPackageHref,
    loadDisabled,
    showSelectReviewHint,
  };
}

export type GraphPageControlShellProps = GraphPageControlsProps & GraphPageControlFilterState;

export type GraphPageControlPickerProps = Pick<
  GraphPageControlsProps,
  | "runId"
  | "onRunIdChange"
  | "onReviewsListAvailabilityChange"
  | "reviewPickerState"
  | "sampleGraphActive"
  | "compactEmptyWorkspace"
> &
  Pick<GraphPageControlFilterState, "runTrim" | "scopedRunFilterActive" | "graphClearScopeHref" | "reviewPackageHref">;

export type GraphPageControlLoadButtonProps = Pick<
  GraphPageControlsProps,
  "showLoadButton" | "loading" | "onLoadGraph" | "loadButtonLabel" | "buyerPolishedShell"
> &
  Pick<GraphPageControlFilterState, "loadDisabled" | "showSelectReviewHint">;

export type GraphPageControlModeFilterProps = Pick<
  GraphPageControlsProps,
  "mode" | "demoUi" | "buyerPolishedShell"
> &
  Pick<GraphPageControlFilterState, "pathname" | "currentSearch" | "runTrim">;

export type GraphPageControlPresentationTabsProps = Pick<
  GraphPageControlsProps,
  "showPresentationTabs" | "sampleGraphActive"
> &
  Pick<GraphPageControlFilterState, "runTrim" | "reviewPackageHref">;

export function shouldShowGraphReviewPickerStatus(
  reviewPickerState: GraphReviewPickerState,
  compactEmptyWorkspace: boolean,
  sampleGraphActive: boolean,
): boolean {
  return (
    reviewPickerState !== "no-packages" &&
    !compactEmptyWorkspace &&
    !(sampleGraphActive && reviewPickerState === "sample-review")
  );
}

export function shouldShowOperatorGraphModeFilters(
  demoUi: boolean,
  buyerPolishedShell: boolean,
  runTrim: string,
): boolean {
  return !(demoUi || buyerPolishedShell) && runTrim.length > 0;
}

export type { GraphMode };
