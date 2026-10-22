"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA,
  BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA,
  BUYER_EVIDENCE_GRAPH_SHOW_ALL_NODES_CTA,
  BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA,
  BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA,
  BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { graphPathOnlyHrefFromSearch } from "@/lib/insights/graph-path-only-url";

/** Accessible name for the buyer Evidence graph canvas control group (TB-2102). */
export const GRAPH_CANVAS_CONTROLS_GROUP_LABEL = "Graph canvas controls";

/** Explains why Highlight path / Focus selection stay disabled until a node is selected. */
export const GRAPH_CANVAS_SELECTION_REQUIRED_TITLE = "Select a node to highlight its path";

export type GraphBuyerCanvasToolbarProps = {
  onFitGraph: () => void;
  onZoom100: () => void;
  onResetView: () => void;
  onTracePath: () => void;
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
  showPathOnly,
  hasSelection,
}: GraphBuyerCanvasToolbarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  // Show-all exits path scope without needing a node; keep it available after deselection.
  const pathToggleNeedsSelection = !showPathOnly;
  const pathActionsDisabled = pathToggleNeedsSelection && !hasSelection;
  const selectionRequiredHintId = "graph-buyer-canvas-selection-required-hint";
  const selectionRequiredReason = pathActionsDisabled
    ? { kind: "prerequisite" as const, message: GRAPH_CANVAS_SELECTION_REQUIRED_TITLE }
    : null;

  const pathOnlyHref = graphPathOnlyHrefFromSearch(currentSearch, !showPathOnly, pathname);
  const showAllHref = graphPathOnlyHrefFromSearch(currentSearch, false, pathname);

  return (
    <div className="space-y-2">
    <FilterChipGroup
      className="flex flex-wrap items-center gap-2"
      data-testid="graph-buyer-canvas-toolbar"
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
        aria-describedby={!hasSelection ? selectionRequiredHintId : undefined}
      >
        {BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA}
      </Button>
      <FilterChip
        href={showPathOnly ? showAllHref : pathOnlyHref}
        scroll={false}
        className={buyerFilterChipClass(showPathOnly, pathActionsDisabled)}
        aria-current={showPathOnly ? "page" : undefined}
        aria-describedby={pathActionsDisabled ? selectionRequiredHintId : undefined}
        disabled={pathActionsDisabled}
        onClick={() => {
          if (pathActionsDisabled) {
            return;
          }

          router.replace(showPathOnly ? showAllHref : pathOnlyHref, { scroll: false });
        }}
      >
        {showPathOnly ? BUYER_EVIDENCE_GRAPH_SHOW_ALL_NODES_CTA : BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA}
      </FilterChip>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onResetView();
          router.replace(showAllHref, { scroll: false });
        }}
      >
        {BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA}
      </Button>
    </FilterChipGroup>
    <WhyDisabledCtaHint
      id={selectionRequiredHintId}
      reason={selectionRequiredReason}
      testId={selectionRequiredHintId}
    />
    </div>
  );
}
