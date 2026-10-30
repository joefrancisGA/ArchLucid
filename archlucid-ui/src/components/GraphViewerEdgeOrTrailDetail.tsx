"use client";

import type * as React from "react";

import { ReasoningTraceReadMore } from "@/components/ReasoningTraceReadMore";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerTrailEdgeDisplayPhrase } from "@/lib/graph-mapper";
import { cn } from "@/lib/utils";
import type { GraphEdgeVm } from "@/types/graph";

export const GRAPH_EDGE_RELATIONSHIP_NOT_STORED = "Relationship type was not stored." as const;

export const GRAPH_EDGE_LABEL_NOT_STORED = "Edge label was not stored." as const;

export const GRAPH_EDGE_REASONING_NOT_STORED = "Reasoning narration was not stored." as const;

export const GRAPH_EDGE_INFERENCE_SOURCE_NOT_STORED = "Inference source was not stored." as const;

export type GraphViewerEdgeOrTrailDetailProps = {
  readonly selectedEdge: GraphEdgeVm;
  readonly buyerTrailPanel: boolean;
};

function formatOperatorRelationshipType(type: string): string {
  const trimmed = type.trim();

  return trimmed.length > 0 ? trimmed : GRAPH_EDGE_RELATIONSHIP_NOT_STORED;
}

function formatEdgeLabel(label: GraphEdgeVm["label"]): string | null {
  if (label === undefined || label === null) {
    return GRAPH_EDGE_LABEL_NOT_STORED;
  }

  const trimmed = String(label).trim();

  if (trimmed.length === 0) {
    return "Edge label was stored empty.";
  }

  return trimmed;
}

export function GraphViewerEdgeOrTrailDetail({
  selectedEdge,
  buyerTrailPanel,
}: GraphViewerEdgeOrTrailDetailProps): React.JSX.Element {
  const relationshipLabel = buyerTrailPanel
    ? buyerTrailEdgeDisplayPhrase(selectedEdge.type)
    : formatOperatorRelationshipType(selectedEdge.type);
  const edgeLabel = formatEdgeLabel(selectedEdge.label);
  const reasoningTrace = selectedEdge.reasoningTrace?.trim() ?? "";

  return (
    <div className="space-y-3">
      <h3 className="mt-0">Edge detail</h3>
      {!buyerTrailPanel ? (
        <>
          {selectedEdge.id !== undefined &&
          selectedEdge.id !== null &&
          String(selectedEdge.id).trim().length > 0 ? (
            <p className="m-0">
              <strong>ID:</strong> {String(selectedEdge.id)}
            </p>
          ) : null}
          <p className="m-0">
            <strong>From:</strong> {selectedEdge.source}
          </p>
          <p className="m-0">
            <strong>To:</strong> {selectedEdge.target}
          </p>
          <p className="m-0">
            <strong>Relationship:</strong> {relationshipLabel}
          </p>
          <p className="m-0">
            <strong>Inference source:</strong>{" "}
            {selectedEdge.inferenceSource !== undefined &&
            selectedEdge.inferenceSource !== null &&
            selectedEdge.inferenceSource.trim().length > 0
              ? selectedEdge.inferenceSource.trim()
              : GRAPH_EDGE_INFERENCE_SOURCE_NOT_STORED}
          </p>
          {edgeLabel !== null ? (
            <p className="m-0">
              <strong>Label:</strong> {edgeLabel}
            </p>
          ) : null}
        </>
      ) : (
        <p className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <strong>Edge:</strong> {selectedEdge.source} → {selectedEdge.target} ({relationshipLabel})
        </p>
      )}
      {reasoningTrace.length > 0 ? (
        <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <ReasoningTraceReadMore heading="Reasoning trace" trace={reasoningTrace} />
        </div>
      ) : (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {GRAPH_EDGE_REASONING_NOT_STORED}
        </p>
      )}
    </div>
  );
}
