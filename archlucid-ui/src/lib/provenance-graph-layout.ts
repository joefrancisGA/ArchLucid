import {
  provenanceNodeDisplayName,
  provenanceNodeVisualStyle,
  wrapProvenanceLabel,
} from "@/lib/provenance-node-presentation";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

export const PROVENANCE_NODE_RADIUS = 20;
export const PROVENANCE_LAYER_HEIGHT = 132;
export const PROVENANCE_LAYOUT_PADDING_X = 72;
export const PROVENANCE_LAYOUT_PADDING_Y = 56;
export const PROVENANCE_LABEL_LINE_HEIGHT = 14;
export const PROVENANCE_MIN_NODE_GAP = 128;

export type ProvenanceLayoutNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
  stroke: string;
  shape: "circle" | "square" | "diamond";
  labelLines: string[];
  fullLabel: string;
  type: string;
  layer: number;
  referenceId: string;
  labelWidth: number;
  labelHeight: number;
};

export type ProvenanceLayoutEdge = {
  id: string;
  type: string;
  fromNodeId: string;
  toNodeId: string;
};

export type ProvenanceGraphBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type ProvenanceGraphLayoutResult = {
  nodes: ProvenanceLayoutNode[];
  edges: ProvenanceLayoutEdge[];
  contentWidth: number;
  contentHeight: number;
  bounds: ProvenanceGraphBounds;
};

function estimateLabelWidth(line: string): number {
  return Math.max(48, line.length * 6.4);
}

function layoutLabelMetrics(labelLines: string[]): { labelWidth: number; labelHeight: number } {
  const labelWidth = Math.max(...labelLines.map(estimateLabelWidth), 48);
  const labelHeight = labelLines.length * PROVENANCE_LABEL_LINE_HEIGHT;

  return { labelWidth, labelHeight };
}

export function computeProvenanceGraphLayout(
  nodes: readonly ArchitectureLinkageNode[],
  edges: readonly ArchitectureLinkageEdge[],
): ProvenanceGraphLayoutResult {
  if (nodes.length === 0) {
    const emptyBounds: ProvenanceGraphBounds = {
      minX: 0,
      minY: 0,
      maxX: 320,
      maxY: 160,
      width: 320,
      height: 160,
    };

    return {
      nodes: [],
      edges: [],
      contentWidth: 320,
      contentHeight: 160,
      bounds: emptyBounds,
    };
  }

  const byLayer = new Map<number, ArchitectureLinkageNode[]>();

  for (const node of nodes) {
    const { layer } = provenanceNodeVisualStyle(node.type);
    const list = byLayer.get(layer) ?? [];
    list.push(node);
    byLayer.set(layer, list);
  }

  const maxPerLayer = Math.max(1, ...[...byLayer.values()].map((layerNodes) => layerNodes.length));
  const contentWidth = Math.max(
    480,
    PROVENANCE_LAYOUT_PADDING_X * 2 + Math.max(maxPerLayer - 1, 0) * PROVENANCE_MIN_NODE_GAP + PROVENANCE_NODE_RADIUS * 2,
  );
  const occupiedLayers = [...byLayer.keys()].sort((a, b) => a - b);
  const compactLayerIndex = new Map(occupiedLayers.map((layer, index) => [layer, index]));
  const contentHeight =
    PROVENANCE_LAYOUT_PADDING_Y * 2 +
    occupiedLayers.length * PROVENANCE_LAYER_HEIGHT +
    PROVENANCE_LABEL_LINE_HEIGHT * 2;

  const layoutNodes: ProvenanceLayoutNode[] = [];

  for (const layer of occupiedLayers) {
    const layerNodes = (byLayer.get(layer) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
    const count = layerNodes.length;
    const span = contentWidth - PROVENANCE_LAYOUT_PADDING_X * 2;
    const gap = count > 1 ? span / count : span;
    const compactLayer = compactLayerIndex.get(layer) ?? 0;

    layerNodes.forEach((node, index) => {
      const style = provenanceNodeVisualStyle(node.type);
      const fullLabel = provenanceNodeDisplayName(node);
      const labelLines = wrapProvenanceLabel(fullLabel, 22, 2);
      const { labelWidth, labelHeight } = layoutLabelMetrics(labelLines);
      const x = PROVENANCE_LAYOUT_PADDING_X + gap * (index + 0.5);
      const y = PROVENANCE_LAYOUT_PADDING_Y + compactLayer * PROVENANCE_LAYER_HEIGHT + PROVENANCE_LAYER_HEIGHT / 2;

      layoutNodes.push({
        id: node.id,
        x,
        y,
        radius: PROVENANCE_NODE_RADIUS,
        fill: style.fill,
        stroke: style.stroke,
        shape: style.shape,
        labelLines,
        fullLabel,
        type: node.type,
        layer: style.layer,
        referenceId: node.referenceId,
        labelWidth,
        labelHeight,
      });
    });
  }

  const layoutEdges: ProvenanceLayoutEdge[] = edges.map((edge) => ({
    id: edge.id,
    type: edge.type,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
  }));

  const bounds = computeProvenanceGraphBounds(layoutNodes);

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    contentWidth: Math.max(contentWidth, bounds.width + PROVENANCE_LAYOUT_PADDING_X),
    contentHeight: Math.max(contentHeight, bounds.height + PROVENANCE_LAYOUT_PADDING_Y),
    bounds,
  };
}

/** Bounds include node circles and rendered label boxes beneath nodes. */
export function computeProvenanceGraphBounds(nodes: readonly ProvenanceLayoutNode[]): ProvenanceGraphBounds {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const nodeMinX = node.x - node.radius;
    const nodeMaxX = node.x + node.radius;
    const nodeMinY = node.y - node.radius;
    const nodeMaxY = node.y + node.radius;
    const labelTop = node.y + node.radius + 6;
    const labelBottom = labelTop + node.labelHeight;
    const labelLeft = node.x - node.labelWidth / 2;
    const labelRight = node.x + node.labelWidth / 2;

    minX = Math.min(minX, nodeMinX, labelLeft);
    maxX = Math.max(maxX, nodeMaxX, labelRight);
    minY = Math.min(minY, nodeMinY);
    maxY = Math.max(maxY, nodeMaxY, labelBottom);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return { minX, minY, maxX, maxY, width, height };
}
