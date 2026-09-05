"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  type ArchitectureFindingsDualPaneDiagramNode,
  resolveFindingDiagramSelectionSync,
} from "@/lib/architecture/architecture-findings-dual-pane";
import {
  REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT,
  type ReviewWorkbenchDiagramNodesEventDetail,
} from "@/lib/workspace-mode/professional-workbench-preference";
import { ReviewWorkbenchLayout, type ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import { useReviewWorkbenchSelection } from "@/components/reviews/ReviewWorkbenchSelectionContext";

function readFindingRefFromDom(findingId: string): {
  readonly findingId: string;
  readonly title: string;
  readonly wireJson: string | null;
  readonly relatedNodeIds: readonly string[];
} {
  const card = document.querySelector<HTMLElement>(`[data-finding-id="${CSS.escape(findingId)}"]`);
  const title =
    card?.getAttribute("data-finding-title")?.trim()
    ?? card?.querySelector("h2,h3")?.textContent?.trim()
    ?? "";
  const relatedNodeIdsRaw = card?.getAttribute("data-finding-related-node-ids");
  const relatedNodeIds =
    relatedNodeIdsRaw?.split(",").map((id) => id.trim()).filter((id) => id.length > 0) ?? [];
  const wireJson = card?.getAttribute("data-finding-wire-json");

  return {
    findingId,
    title,
    wireJson: wireJson ?? null,
    relatedNodeIds,
  };
}

/** Shared finding selection: finding clicks, diagram highlight, evidence scroll (LI-09 / PT-12). */
export function WorkbenchSelectionCoordinator(props: { readonly enabled: boolean }): null {
  const selection = useReviewWorkbenchSelection();
  const [diagramNodes, setDiagramNodes] = useState<readonly ArchitectureFindingsDualPaneDiagramNode[]>([]);

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    const onDiagramNodes = (event: Event) => {
      const detail = (event as CustomEvent<ReviewWorkbenchDiagramNodesEventDetail>).detail;
      setDiagramNodes(detail?.nodes ?? []);
    };

    window.addEventListener(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, onDiagramNodes);

    return () => window.removeEventListener(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, onDiagramNodes);
  }, [props.enabled]);

  useEffect(() => {
    if (!props.enabled || selection === null) {
      return;
    }

    const selectedId = selection.selectedFindingId?.trim() ?? "";

    if (selectedId.length === 0) {
      selection.setHighlightedNodeId(null);

      return;
    }

    const findingRef = readFindingRefFromDom(selectedId);
    const sync = resolveFindingDiagramSelectionSync(findingRef, diagramNodes);

    selection.setHighlightedNodeId(sync.matchedNodeId);
  }, [diagramNodes, props.enabled, selection, selection?.selectedFindingId]);

  useEffect(() => {
    if (selection === null) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const card = target.closest<HTMLElement>("[data-finding-id]");

      if (card === null) {
        return;
      }

      const findingId = card.getAttribute("data-finding-id")?.trim() ?? "";

      if (findingId.length > 0) {
        selection.setSelectedFindingId(findingId);
      }
    };

    document.addEventListener("click", onClick, true);

    return () => document.removeEventListener("click", onClick, true);
  }, [selection]);

  useEffect(() => {
    if (!props.enabled || selection === null) {
      return;
    }

    const selectedId = selection.selectedFindingId?.trim() ?? "";
    const evidenceColumn = document.querySelector<HTMLElement>('[data-testid="review-workbench-column-evidence"]');

    if (evidenceColumn === null) {
      return;
    }

    const linkedRows = evidenceColumn.querySelectorAll<HTMLElement>("[data-linked-finding-id]");
    let matched = false;

    for (const row of linkedRows) {
      const linkedId = row.getAttribute("data-linked-finding-id")?.trim() ?? "";
      const isMatch = selectedId.length > 0 && linkedId === selectedId;

      row.setAttribute("data-workbench-evidence-selected", isMatch ? "true" : "false");

      if (isMatch) {
        matched = true;
        row.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    evidenceColumn.setAttribute(
      "data-workbench-evidence-empty",
      selectedId.length > 0 && !matched && linkedRows.length === 0 ? "true" : "false",
    );
  }, [props.enabled, selection, selection?.selectedFindingId]);

  useEffect(() => {
    if (props.enabled || selection === null) {
      return;
    }

    // Tab-only layout still restores ?findingId=; only drop workbench node highlight.
    selection.setHighlightedNodeId(null);
  }, [props.enabled, selection]);

  return null;
}

export type WorkbenchLayoutBridgeProps = {
  readonly architecture: ReactNode;
  readonly findings: ReactNode;
  readonly evidence: ReactNode;
  readonly focusColumn: ReviewWorkbenchColumnId | null;
  readonly onFocusColumn: (column: ReviewWorkbenchColumnId) => void;
  readonly onExitWorkbench: () => void;
};

export function WorkbenchLayoutBridge(props: WorkbenchLayoutBridgeProps): React.JSX.Element {
  const selection = useReviewWorkbenchSelection();
  const [diagramNodes, setDiagramNodes] = useState<readonly ArchitectureFindingsDualPaneDiagramNode[]>([]);
  const [selectedFindingTitle, setSelectedFindingTitle] = useState<string | null>(null);

  useEffect(() => {
    const onDiagramNodes = (event: Event) => {
      const detail = (event as CustomEvent<ReviewWorkbenchDiagramNodesEventDetail>).detail;
      setDiagramNodes(detail?.nodes ?? []);
    };

    window.addEventListener(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, onDiagramNodes);

    return () => window.removeEventListener(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, onDiagramNodes);
  }, []);

  useEffect(() => {
    const selectedId = selection?.selectedFindingId?.trim() ?? "";

    if (selectedId.length === 0) {
      setSelectedFindingTitle(null);

      return;
    }

    const findingRef = readFindingRefFromDom(selectedId);
    setSelectedFindingTitle(findingRef.title.length > 0 ? findingRef.title : null);
  }, [selection?.selectedFindingId]);

  const highlightedNodeLabel = (() => {
    const nodeId = selection?.highlightedNodeId?.trim() ?? "";

    if (nodeId.length === 0) {
      return null;
    }

    const matched = diagramNodes.find((node) => node.id === nodeId);

    return matched?.label ?? nodeId;
  })();

  return (
    <ReviewWorkbenchLayout
      architecture={props.architecture}
      findings={props.findings}
      evidence={props.evidence}
      focusColumn={props.focusColumn}
      onFocusColumn={props.onFocusColumn}
      onExitWorkbench={props.onExitWorkbench}
      selectedFindingId={selection?.selectedFindingId ?? null}
      selectedFindingTitle={selectedFindingTitle}
      highlightedNodeId={selection?.highlightedNodeId ?? null}
      highlightedNodeLabel={highlightedNodeLabel}
    />
  );
}
