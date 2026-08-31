"use client";

import type * as React from "react";

import { ReasoningTraceReadMore } from "@/components/ReasoningTraceReadMore";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { GraphEdgeVm } from "@/types/graph";

export type GraphViewerEdgeOrTrailDetailProps = {
  readonly selectedEdge: GraphEdgeVm;
  readonly buyerTrailPanel: boolean;
};

export function GraphViewerEdgeOrTrailDetail({
  selectedEdge,
  buyerTrailPanel,
}: GraphViewerEdgeOrTrailDetailProps): React.JSX.Element {
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
            <strong>Relationship:</strong> {selectedEdge.type}
          </p>
          {selectedEdge.label !== undefined &&
          selectedEdge.label !== null &&
          String(selectedEdge.label).trim().length > 0 ? (
            <p className="m-0">
              <strong>Label:</strong> {String(selectedEdge.label)}
            </p>
          ) : null}
          {selectedEdge.inferenceSource !== undefined &&
          selectedEdge.inferenceSource !== null &&
          selectedEdge.inferenceSource.trim().length > 0 ? (
            <p className="m-0">
              <strong>Inference rule:</strong> {selectedEdge.inferenceSource.trim()}
            </p>
          ) : null}
        </>
      ) : (
        <p className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <strong>Edge:</strong> {selectedEdge.source} → {selectedEdge.target} ({selectedEdge.type})
        </p>
      )}
      {selectedEdge.reasoningTrace !== undefined &&
      selectedEdge.reasoningTrace !== null &&
      selectedEdge.reasoningTrace.trim().length > 0 ? (
        <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <ReasoningTraceReadMore heading="Reasoning trace" trace={selectedEdge.reasoningTrace} />
        </div>
      ) : (
        !buyerTrailPanel && (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            No reasoning narration was persisted for this edge.
          </p>
        )
      )}
    </div>
  );
}
