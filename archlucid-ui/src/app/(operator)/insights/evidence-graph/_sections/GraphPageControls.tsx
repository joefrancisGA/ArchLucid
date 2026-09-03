"use client";

import type { AskRunListAvailability, GraphReviewPickerState } from "@/lib/graph-page-state";

import type { GraphMode } from "./graph-page-helpers";
import { GraphPageControlsBuyerShell } from "./GraphPageControlsBuyerShell";
import { GraphPageControlsOperatorShell } from "./GraphPageControlsOperatorShell";
import { useGraphPageControlFilters } from "./use-graph-page-control-filters";

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
  const filterState = useGraphPageControlFilters(props);
  const shellProps = { ...props, ...filterState };

  if (props.buyerPolishedShell) {
    return <GraphPageControlsBuyerShell {...shellProps} />;
  }

  return <GraphPageControlsOperatorShell {...shellProps} />;
}
