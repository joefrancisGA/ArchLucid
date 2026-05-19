import type { Edge, Node } from "reactflow";
import type { GraphNodeVm, GraphViewModel } from "@/types/graph";
import { isProvenanceTrailCoordinatorType } from "@/lib/provenance-graph-presentation";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

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
    case "PolicyPack":
      return "#ecfccb";
    default:
      return "#f5f5f5";
  }
}

export type MapGraphPresentation = "operator" | "buyerTrail";

/** Secondary line on buyer-trail nodes that represent packaged evidence inputs / linkage artifacts (not outcomes). */
function buyerTrailEvidenceSourceSubtitle(nodeType: string): string | null {
  switch (nodeType) {
    case "ContextSnapshot":
      return "· Evidence source · reviewed inputs";

    case "GraphSnapshot":
      return "· Evidence artifact · linkage snapshot";

    default:
      return null;
  }
}

function nodeLabelForPresentation(node: GraphViewModel["nodes"][number], presentation: MapGraphPresentation): string {
  if (presentation === "buyerTrail") {
    const subtitle = buyerTrailEvidenceSourceSubtitle(node.type);

    if (subtitle !== null) {
      return `${node.label}\n${subtitle}`;
    }

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

/** Readable relationship verbs for buyer-trail edges (avoid faint technical verbs). */
function buyerTrailEdgeDisplayPhrase(edgeType: string): string {
  const key = edgeType.trim().toLowerCase();
  const phrases: Record<string, string> = {
    produced: "Led to output",
    next: "Next step",
    raised: "Flagged risk",
    recorded: "Recorded in",
    "recorded in": "Anchored in manifest",
    packaged: "Packaged as",
    precedes: "Comes before",
    validates: "Validated against",
    informs: "Informs next step",
    references: "References",
    derived: "Derived from",
    "derived from": "Derived from",
    depends: "Depends on",
    "depends on": "Depends on",
    depends_on: "Depends on",
    supports: "Supports",
    blocks: "Blocks",
    implements: "Implements",
  };

  const mapped = phrases[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return humanizeEdgeLabel(edgeType);
}

/** True when this reviewer-trail finding is the showcase PHI minimization hero (layout + panel emphasis). */
export function isBuyerTrailPhiHeroNode(node: GraphNodeVm): boolean {
  if (node.type !== "Finding") {
    return false;
  }

  const ref = node.metadata?.referenceId?.trim() ?? "";

  if (ref === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
    return true;
  }

  const label = node.label.toLowerCase();

  if (label.includes("phi") && (label.includes("minimization") || label.includes("minimisation"))) {
    return true;
  }

  const id = node.id.toLowerCase();

  return id.includes("phi");
}

function orderBuyerTrailNodesPhiCentral(nodes: GraphNodeVm[]): GraphNodeVm[] {
  const idx = nodes.findIndex((n) => isBuyerTrailPhiHeroNode(n));

  if (idx < 0) {
    return nodes;
  }

  const hero = nodes[idx]!;
  const rest = [...nodes.slice(0, idx), ...nodes.slice(idx + 1)];
  const n = nodes.length;
  const center = Math.floor(n / 2);
  const ordered: GraphNodeVm[] = [];
  let restIdx = 0;

  for (let i = 0; i < n; i++) {
    if (i === center) {
      ordered.push(hero);
    } else {
      ordered.push(rest[restIdx]!);
      restIdx++;
    }
  }

  return ordered;
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
  const isBuyerTrail = presentation === "buyerTrail";
  const layoutNodes = isBuyerTrail ? orderBuyerTrailNodesPhiCentral(graph.nodes) : graph.nodes;
  const heroId = isBuyerTrail ? layoutNodes.find((n) => isBuyerTrailPhiHeroNode(n))?.id : undefined;

  const columnCount = isBuyerTrail ? 4 : 5;
  const cellW = isBuyerTrail ? 360 : 240;
  const cellH = isBuyerTrail ? 240 : 140;
  const nodeWidth = isBuyerTrail ? 320 : 180;
  const heroNodeWidth = isBuyerTrail ? 356 : nodeWidth;
  const fontSize = isBuyerTrail ? 26 : 12;
  const heroFontSize = isBuyerTrail ? 32 : fontSize;

  const nodes: Node[] = layoutNodes.map((node, index) => {
    const hero = isBuyerTrail && isBuyerTrailPhiHeroNode(node);
    const width = hero ? heroNodeWidth : nodeWidth;
    const fs = hero ? heroFontSize : fontSize;

    return {
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
        border: hero
          ? "4px solid #b45309"
          : isBuyerTrail
            ? "2px solid #64748b"
            : "1px solid #999",
        borderRadius: 10,
        padding: isBuyerTrail ? (hero ? 16 : 12) : 8,
        background: hero ? "#fde68a" : pickColor(node.type),
        width,
        whiteSpace: "pre-wrap",
        fontSize: fs,
        fontWeight: isBuyerTrail ? (hero ? 700 : 500) : 400,
        color: "#0f172a",
        boxShadow: hero ? "0 10px 28px rgba(180, 83, 9, 0.22)" : undefined,
      },
      type: "default",
    };
  });

  const edges: Edge[] = graph.edges.map((edge, index) => {
    const showHumanLabel = isBuyerTrail;
    const touchesHero =
      heroId !== undefined && (edge.source === heroId || edge.target === heroId);

    return {
      id: `${edge.source}-${edge.target}-${edge.type}-${index}`,
      source: edge.source,
      target: edge.target,
      data: {
        raw: edge,
      },
      label: showHumanLabel ? buyerTrailEdgeDisplayPhrase(edge.type) : edge.type,
      type: "smoothstep",
      animated: isBuyerTrail && (edge.type === "raised" || touchesHero),
      style: isBuyerTrail
        ? {
            stroke: touchesHero ? "#b45309" : "#475569",
            strokeWidth: touchesHero ? 3 : 2.25,
          }
        : { stroke: "#94a3b8", strokeWidth: 1.25 },
      labelStyle: isBuyerTrail
        ? { fill: touchesHero ? "#9a3412" : "#0f172a", fontWeight: 700, fontSize: touchesHero ? 23 : 22 }
        : { fill: "#64748b", fontSize: 11 },
      labelBgStyle:
        isBuyerTrail
          ? { fill: "#ffffff", fillOpacity: 0.97 }
          : { fill: "#f8fafc", fillOpacity: 0.9 },
      labelBgPadding: [6, 3] as [number, number],
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
