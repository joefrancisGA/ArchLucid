"use client";

import type { RefObject } from "react";

import { cn } from "@/lib/utils";

import {
  PROVENANCE_LABEL_LINE_HEIGHT,
  type ProvenanceLayoutNode,
} from "@/lib/provenance-graph-layout";
import {
  PROVENANCE_GRAPH_MIN_LABEL_FONT_PX,
  provenanceTransformToSvg,
  type ProvenanceViewportTransform,
} from "@/lib/provenance-graph-viewport";
import { provenanceNodeTypeLabel } from "@/lib/provenance-node-presentation";
import type { ArchitectureLinkageEdge } from "@/types/architecture-provenance";

import { ProvenanceNodeShape } from "./ProvenanceNodeShape";

export type ProvenanceGraphViewportCanvasProps = {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly markerId: string;
  readonly transform: ProvenanceViewportTransform;
  readonly graphReady: boolean;
  readonly graphSummaryLabel: string;
  readonly visibleEdges: readonly ArchitectureLinkageEdge[];
  readonly layoutNodes: readonly ProvenanceLayoutNode[];
  readonly posById: ReadonlyMap<string, ProvenanceLayoutNode>;
  readonly selectedNodeId: string | null;
  readonly highlightedEdgeId: string | null;
  readonly connectedNodeIds: ReadonlySet<string>;
  readonly onSelectNode: (nodeId: string) => void;
};

export function ProvenanceGraphViewportCanvas({
  svgRef,
  markerId,
  transform,
  graphReady,
  graphSummaryLabel,
  visibleEdges,
  layoutNodes,
  posById,
  selectedNodeId,
  highlightedEdgeId,
  connectedNodeIds,
  onSelectNode,
}: ProvenanceGraphViewportCanvasProps): React.JSX.Element {
  const labelFontSize = PROVENANCE_GRAPH_MIN_LABEL_FONT_PX / Math.max(transform.scale, 0.01);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      className={cn("block", graphReady ? "opacity-100" : "opacity-0")}
      role="group"
      aria-label={graphSummaryLabel}
      data-testid="provenance-graph-svg"
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
        </marker>
      </defs>
      <g transform={provenanceTransformToSvg(transform)}>
        {visibleEdges.map((edge) => {
          const from = posById.get(edge.fromNodeId);
          const to = posById.get(edge.toNodeId);

          if (from === undefined || to === undefined) {
            return null;
          }

          const selected =
            selectedNodeId !== null &&
            (edge.fromNodeId === selectedNodeId || edge.toNodeId === selectedNodeId);
          const highlighted = highlightedEdgeId === edge.id;
          const dimmed =
            selectedNodeId !== null &&
            !selected &&
            highlightedEdgeId === null;

          return (
            <g key={edge.id} data-testid={`provenance-edge-${edge.id}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={highlighted || selected ? "var(--al-accent-interactive)" : "#94a3b8"}
                strokeWidth={highlighted ? 2.5 : selected ? 2 : 1.25}
                markerEnd={`url(#${markerId})`}
                className={dimmed ? "prov-graph-edge-dimmed" : undefined}
              />
              <title>{`${edge.type}: ${from.fullLabel} → ${to.fullLabel}`}</title>
            </g>
          );
        })}
        {layoutNodes.map((node) => {
          const selected = selectedNodeId === node.id;
          const connected = connectedNodeIds.has(node.id);
          const dimmed =
            selectedNodeId !== null && !selected && !connected && highlightedEdgeId === null;
          const nodeTypeLabel = provenanceNodeTypeLabel(node.type);
          const nodeRadius = selected ? node.radius + 4 : node.radius;

          return (
            <g
              key={node.id}
              data-provenance-node="true"
              data-testid={`provenance-node-${node.id}`}
              role="button"
              tabIndex={0}
              aria-label={`${node.fullLabel}, ${nodeTypeLabel}`}
              className="cursor-pointer outline-none focus-visible:outline-none"
              onClick={(event) => {
                event.stopPropagation();
                onSelectNode(node.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();
                onSelectNode(node.id);
              }}
            >
              <rect
                className={cn("prov-node-focus-indicator opacity-0", selected ? "opacity-100" : undefined)}
                x={node.x - nodeRadius - 6}
                y={node.y - nodeRadius - 6}
                width={(nodeRadius + 6) * 2}
                height={(nodeRadius + 6) * 2 + node.labelHeight + 12}
                rx={8}
                fill="none"
                stroke="var(--al-accent-interactive)"
                strokeWidth={2}
                pointerEvents="none"
              />
              <ProvenanceNodeShape node={node} selected={selected} connected={connected} dimmed={dimmed} />
              <text
                x={node.x}
                y={node.y + node.radius + 16}
                textAnchor="middle"
                fontSize={labelFontSize}
                fill={dimmed ? "var(--al-text-disabled)" : "var(--al-text-secondary)"}
                className="pointer-events-none"
              >
                {node.labelLines.map((line, index) => (
                  <tspan key={`${node.id}-${index}`} x={node.x} dy={index === 0 ? 0 : PROVENANCE_LABEL_LINE_HEIGHT}>
                    {line}
                  </tspan>
                ))}
              </text>
              <title>{`${node.fullLabel}\n${nodeTypeLabel}`}</title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
