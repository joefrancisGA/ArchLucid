import type { Edge, Node } from "reactflow";
import type { GraphNodeVm, GraphViewModel } from "@/types/graph";
import {
  graphNodeKindPresentation,
  resolveGraphNodeKindBuyerLabel,
  resolveGraphNodeKindKey,
} from "@/lib/graph-node-kind-presentation";
import { isProvenanceTrailCoordinatorType } from "@/lib/provenance-graph-presentation";
import {
  isActiveSampleHeroFindingId,
  isSampleHeroFindingReferenceId,
  listRegisteredSampleScenarios,
} from "@/lib/samples/registry";

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
    const evidenceSubtitle = buyerTrailEvidenceSourceSubtitle(node.type);

    if (evidenceSubtitle !== null) {
      return `${node.label}\n${evidenceSubtitle}`;
    }

    const kindLabel = resolveGraphNodeKindBuyerLabel(node.type);

    if (kindLabel !== null) {
      return `${node.label}\n· ${kindLabel}`;
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
export function buyerTrailEdgeDisplayPhrase(edgeType: string): string {
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
    "monitored via": "Under monitoring",
    "mitigated by": "Mitigated by",
    "reviewed by": "Reviewed by",
    "owned by": "Owned by",
    "evaluated against": "Evaluated against",
    defines: "Defines",
    "applied in": "Applied in",
    cites: "Cites",
    "finalized in": "Finalized in",
  };

  const mapped = phrases[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return humanizeEdgeLabel(edgeType);
}

/** True when this reviewer-trail finding is a registered sample hero (layout + panel emphasis). */
export function isBuyerTrailPhiHeroNode(node: GraphNodeVm): boolean {
  if (node.type !== "Finding") {
    return false;
  }

  const ref = node.metadata?.referenceId?.trim() ?? "";

  if (isSampleHeroFindingReferenceId(ref) || isActiveSampleHeroFindingId(ref)) {
    return true;
  }

  const label = node.label.toLowerCase();

  for (const scenario of listRegisteredSampleScenarios()) {
    const heroTitle = scenario.primaryFindingTitle.toLowerCase();

    if (label === heroTitle || label.includes(heroTitle)) {
      return true;
    }
  }

  return isSampleHeroFindingReferenceId(node.id) || isActiveSampleHeroFindingId(node.id);
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
  const cellW = isBuyerTrail ? 320 : 240;
  const cellH = isBuyerTrail ? 200 : 140;
  const nodeWidth = isBuyerTrail ? 320 : 180;
  const heroNodeWidth = isBuyerTrail ? 356 : nodeWidth;
  const fontSize = isBuyerTrail ? 26 : 12;
  const heroFontSize = isBuyerTrail ? 32 : fontSize;

  const nodes: Node[] = layoutNodes.map((node, index) => {
    const hero = isBuyerTrail && isBuyerTrailPhiHeroNode(node);
    const width = hero ? heroNodeWidth : nodeWidth;
    const fs = hero ? heroFontSize : fontSize;
    const kindKey = resolveGraphNodeKindKey(node.type);
    const kindPresentation = graphNodeKindPresentation(kindKey);

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
          ? "4px solid var(--al-status-warn-fg)"
          : isBuyerTrail
            ? `2px solid ${kindPresentation.border}`
            : `1px solid ${kindPresentation.border}`,
        borderRadius: 10,
        padding: isBuyerTrail ? (hero ? 16 : 12) : 8,
        background: hero ? "var(--al-status-warn-bg)" : kindPresentation.background,
        width,
        whiteSpace: "pre-wrap",
        fontSize: fs,
        fontWeight: isBuyerTrail ? (hero ? 700 : 500) : 400,
        color: "var(--al-text-primary)",
        boxShadow: hero ? "0 10px 28px color-mix(in srgb, var(--al-status-warn-fg) 22%, transparent)" : undefined,
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
            stroke: touchesHero ? "var(--al-status-warn-fg)" : "var(--al-text-secondary)",
            strokeWidth: touchesHero ? 3 : 2.25,
          }
        : { stroke: "#94a3b8", strokeWidth: 1.25 },
      labelStyle: isBuyerTrail
        ? {
            fill: touchesHero ? "var(--al-status-warn-fg)" : "var(--al-text-primary)",
            fontWeight: 700,
            fontSize: touchesHero ? 16 : 14,
          }
        : { fill: "#475569", fontSize: 12 },
      labelBgStyle:
        isBuyerTrail
          ? { fill: "#ffffff", fillOpacity: 0.98 }
          : { fill: "#f8fafc", fillOpacity: 0.9 },
      labelBgPadding: [7, 4] as [number, number],
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
