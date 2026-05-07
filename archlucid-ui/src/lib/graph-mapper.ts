import type { Edge, Node } from "reactflow";
import type { GraphViewModel } from "@/types/graph";
import { isProvenanceTrailCoordinatorType } from "@/lib/provenance-graph-presentation";

/** Maps a graph node type to a background color for visual differentiation in React Flow. */
function pickColor(type: string): string {
  switch (type) {
    case "Decision":
      return "#dbeafe";
    case "Finding":
      return "#fef3c7";
    case "Rule":
      return "#ede9fe";
    case "Artifact":
      return "#dcfce7";
    case "Manifest":
      return "#f3f4f6";
    case "GraphNode":
    case "TopologyResource":
      return "#e0f2fe";
    case "SecurityBaseline":
      return "#fee2e2";
    case "PolicyControl":
      return "#ecfccb";
    case "Requirement":
      return "#fae8ff";
    case "ArchitectureRun":
      return "#ccfbf1";
    case "ContextSnapshot":
    case "GraphSnapshot":
    case "FindingsSnapshot":
      return "#e0f2fe";
    case "GoldenManifest":
      return "#d1fae5";
    case "ArtifactBundle":
      return "#ede9fe";
    default:
      return "#f5f5f5";
  }
}

export type MapGraphPresentation = "operator" | "buyerTrail";

function nodeLabelForPresentation(node: GraphViewModel["nodes"][number], presentation: MapGraphPresentation): string {
  if (presentation === "buyerTrail") {
    return node.label;
  }

  return `${node.label}\n(${node.type})`;
}

function humanizeEdgeLabel(edgeType: string): string {
  const t = edgeType.trim();

  if (t.length === 0) {
    return "";
  }

  return t.replace(/[._]/g, " ");
}

/**
 * Converts ArchLucid graph nodes/edges into React Flow format.
 * Nodes are laid out in a grid (4 columns for larger buyer nodes) for a simple initial view.
 */
export function mapGraphToReactFlow(
  graph: GraphViewModel,
  presentation: MapGraphPresentation = "operator",
): {
  nodes: Node[];
  edges: Edge[];
} {
  const columnCount = presentation === "buyerTrail" ? 4 : 5;
  const cellW = presentation === "buyerTrail" ? 280 : 240;
  const cellH = presentation === "buyerTrail" ? 160 : 140;
  const nodeWidth = presentation === "buyerTrail" ? 240 : 180;
  const fontSize = presentation === "buyerTrail" ? 13 : 12;

  const nodes: Node[] = graph.nodes.map((node, index) => ({
    id: node.id,
    position: {
      x: (index % columnCount) * cellW,
      y: Math.floor(index / columnCount) * cellH,
    },
    data: {
      label: nodeLabelForPresentation(node, presentation),
      raw: node,
    },
    style: {
      border: presentation === "buyerTrail" ? "2px solid #64748b" : "1px solid #999",
      borderRadius: 10,
      padding: presentation === "buyerTrail" ? 12 : 8,
      background: pickColor(node.type),
      width: nodeWidth,
      whiteSpace: "pre-wrap",
      fontSize,
      fontWeight: presentation === "buyerTrail" ? 500 : 400,
      color: "#0f172a",
    },
    type: "default",
  }));

  const edges: Edge[] = graph.edges.map((edge, index) => {
    const showHumanLabel = presentation === "buyerTrail";

    return {
      id: `${edge.source}-${edge.target}-${edge.type}-${index}`,
      source: edge.source,
      target: edge.target,
      label: showHumanLabel ? humanizeEdgeLabel(edge.type) : edge.type,
      type: "smoothstep",
      animated: presentation === "buyerTrail" && edge.type === "raised",
      style:
        presentation === "buyerTrail"
          ? { stroke: "#475569", strokeWidth: 2.25 }
          : { stroke: "#94a3b8", strokeWidth: 1.25 },
      labelStyle:
        presentation === "buyerTrail"
          ? { fill: "#0f172a", fontWeight: 600, fontSize: 12 }
          : { fill: "#64748b", fontSize: 11 },
      labelBgStyle:
        presentation === "buyerTrail"
          ? { fill: "#ffffff", fillOpacity: 0.95 }
          : { fill: "#f8fafc", fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
    };
  });

  return { nodes, edges };
}

/** True when every node is a coordinator provenance trail type (demo/API review-trail graph). */
export function graphLooksLikeCoordinatorProvenanceTrail(graph: GraphViewModel): boolean {
  if (graph.nodes.length === 0) {
    return false;
  }

  return graph.nodes.every(
    (n) => isProvenanceTrailCoordinatorType(n.type) || n.type === "Finding",
  );
}
