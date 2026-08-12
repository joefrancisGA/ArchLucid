"use client";

import { Button } from "@/components/ui/button";
import {
  BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA,
  BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA,
  BUYER_EVIDENCE_GRAPH_SHOW_ALL_NODES_CTA,
  BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA,
  BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA,
  BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA,
} from "@/lib/buyer/buyer-polish-copy";

/** Accessible name for the buyer Evidence graph canvas control group (TB-2102). */
export const GRAPH_CANVAS_CONTROLS_GROUP_LABEL = "Graph canvas controls";

/** Explains why Highlight path / Focus selection stay disabled until a node is selected. */
export const GRAPH_CANVAS_SELECTION_REQUIRED_TITLE = "Select a node to highlight its path";

export type GraphBuyerCanvasToolbarProps = {
  onFitGraph: () => void;
  onZoom100: () => void;
  onResetView: () => void;
  onTracePath: () => void;
  onTogglePathOnly: () => void;
  showPathOnly: boolean;
  hasSelection: boolean;
};

/**
 * Buyer-trail canvas zoom + path tools. Selection-dependent actions stay disabled
 * with an explanatory title until a node is selected (TB-2102).
 */
export function GraphBuyerCanvasToolbar({
  onFitGraph,
  onZoom100,
  onResetView,
  onTracePath,
  onTogglePathOnly,
  showPathOnly,
  hasSelection,
}: GraphBuyerCanvasToolbarProps) {
  // Show-all exits path scope without needing a node; keep it available after deselection.
  const pathToggleNeedsSelection = !showPathOnly;
  const pathActionsDisabled = pathToggleNeedsSelection && !hasSelection;
  const selectionRequiredTitle = pathActionsDisabled ? GRAPH_CANVAS_SELECTION_REQUIRED_TITLE : undefined;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="graph-buyer-canvas-toolbar"
      role="group"
      aria-label={GRAPH_CANVAS_CONTROLS_GROUP_LABEL}
    >
      <Button type="button" size="sm" variant="outline" onClick={onFitGraph}>
        {BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onZoom100}>
        {BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onTracePath}
        disabled={!hasSelection}
        title={!hasSelection ? GRAPH_CANVAS_SELECTION_REQUIRED_TITLE : undefined}
      >
        {BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={showPathOnly ? "primary" : "outline"}
        onClick={onTogglePathOnly}
        disabled={pathActionsDisabled}
        title={selectionRequiredTitle}
      >
        {showPathOnly ? BUYER_EVIDENCE_GRAPH_SHOW_ALL_NODES_CTA : BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onResetView}>
        {BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA}
      </Button>
    </div>
  );
}
