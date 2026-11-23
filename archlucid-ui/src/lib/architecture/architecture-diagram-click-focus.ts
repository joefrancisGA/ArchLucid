import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";
import type {
  InfraEvidenceMermaidOutline,
  InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

const FLOWCHART_DOM_NODE_ID = /^flowchart-(.+)-\d+$/u;

export type DiagramClickFocusPoint = {
  readonly x: number;
  readonly y: number;
};

export type DiagramClickFocusRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type DiagramClickFocusNode = {
  readonly id: string;
  readonly center: DiagramClickFocusPoint;
};

export type DiagramClickFocusFrame = {
  readonly id: string;
  readonly rect: DiagramClickFocusRect;
  readonly kind: "vnet" | "resourceGroup";
};

export type DiagramClickFocusEdge = {
  readonly from: readonly string[];
  readonly to: readonly string[];
};

export type DiagramClickFocusFacts = {
  readonly nodes: readonly DiagramClickFocusNode[];
  readonly frames: readonly DiagramClickFocusFrame[];
  readonly edges: readonly DiagramClickFocusEdge[];
};

export type DiagramClickFocusResult = {
  readonly keptNodeIds: ReadonlySet<string>;
  readonly keptFrameIds: ReadonlySet<string>;
  readonly keptEdgeIndexes: ReadonlySet<number>;
};

export function resolveDiagramClickFocus(
  clickedNodeId: string,
  outline: InfraEvidenceMermaidOutline | null | undefined,
  facts: DiagramClickFocusFacts,
): DiagramClickFocusResult {
  const clickedId = normalizeDiagramFocusToken(clickedNodeId);
  const keptNodeIds = new Set<string>();
  const keptFrameIds = new Set<string>();

  if (clickedId.length === 0) {
    return { keptNodeIds, keptFrameIds, keptEdgeIndexes: new Set<number>() };
  }

  keptNodeIds.add(clickedId);

  if (outline != null) {
    for (const edge of outline.edges) {
      const from = normalizeDiagramFocusToken(edge.from);
      const to = normalizeDiagramFocusToken(edge.to);

      if (from === clickedId) {
        keptNodeIds.add(to);
      } else if (to === clickedId) {
        keptNodeIds.add(from);
      }
    }
  } else {
    for (const edge of facts.edges) {
      const from = edge.from.map(normalizeDiagramFocusToken);
      const to = edge.to.map(normalizeDiagramFocusToken);

      if (from.includes(clickedId)) {
        to.forEach((id) => keptNodeIds.add(id));
      } else if (to.includes(clickedId)) {
        from.forEach((id) => keptNodeIds.add(id));
      }
    }
  }

  const clickedNode = facts.nodes.find((node) => normalizeDiagramFocusToken(node.id) === clickedId);

  for (const frame of facts.frames) {
    if (clickedNode !== undefined && containsPoint(frame.rect, clickedNode.center)) {
      keptFrameIds.add(frame.id);
    }

    if (
      frame.kind === "vnet"
      && keptNodeIds.has(normalizeDiagramFocusToken(frame.id.replace(/^vnet-/u, "")))
    ) {
      keptFrameIds.add(frame.id);
    }
  }

  for (const frame of facts.frames) {
    if (frame.kind !== "vnet" || !keptFrameIds.has(frame.id)) {
      continue;
    }

    for (const node of facts.nodes) {
      if (containsPoint(frame.rect, node.center)) {
        keptNodeIds.add(normalizeDiagramFocusToken(node.id));
      }
    }
  }

  const keptEdgeIndexes = new Set<number>();

  facts.edges.forEach((edge, index) => {
    const from = edge.from.map(normalizeDiagramFocusToken);
    const to = edge.to.map(normalizeDiagramFocusToken);

    if (
      (edge.from.length === 1 && edge.to.length === 1
        && keptNodeIds.has(from[0])
        && keptNodeIds.has(to[0]))
      || (from.some((id) => keptNodeIds.has(id)) && to.some((id) => keptNodeIds.has(id)))
    ) {
      keptEdgeIndexes.add(index);
    }
  });

  return { keptNodeIds, keptFrameIds, keptEdgeIndexes };
}

function containsPoint(rect: DiagramClickFocusRect, point: DiagramClickFocusPoint): boolean {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}

export function resolveInventoryDiagramClickFocusId(
  domNodeId: string,
  titleText: string,
  outline: InfraEvidenceMermaidOutline | null | undefined,
): string {
  const trimmedDomId = domNodeId.trim();

  if (outline == null) {
    return trimmedDomId;
  }

  const domSlug = readMermaidFlowchartDomNodeSlug(trimmedDomId);
  const titleTokens = readDiagramNodeTitleFocusTokens(titleText);

  if (titleTokens.length === 0 && domSlug.trim().length === 0) {
    return trimmedDomId;
  }

  for (const node of outline.nodes) {
    if (outlineNodeMatchesDomFocus(node, domSlug, titleTokens)) {
      return node.id;
    }
  }

  return trimmedDomId;
}

function readMermaidFlowchartDomNodeSlug(domNodeId: string): string {
  const match = FLOWCHART_DOM_NODE_ID.exec(domNodeId.trim());

  if (match !== null) {
    return match[1];
  }

  return domNodeId.trim();
}

function readDiagramNodeTitleFocusTokens(titleText: string): readonly string[] {
  const trimmed = titleText.trim();
  const tokens = new Set<string>();

  const pushToken = (value: string): void => {
    const normalized = normalizeDiagramFocusToken(value);

    if (normalized.length > 0) {
      tokens.add(normalized);
    }
  };

  if (trimmed.length > 0) {
    pushToken(trimmed);
  }

  const primarySegment = trimmed.split(" · ", 1)[0]?.trim() ?? "";

  if (primarySegment.length > 0) {
    pushToken(primarySegment);

    const withoutTypeSuffix = primarySegment.replace(/\s\([^)]+\)\s*$/u, "").trim();

    if (withoutTypeSuffix.length > 0) {
      pushToken(withoutTypeSuffix);
    }
  }

  return [...tokens];
}

function outlineNodeFocusTokens(node: InfraEvidenceMermaidOutlineNode): readonly string[] {
  const values = [
    node.id,
    node.label,
    node.seedNodeId ?? "",
    resolveInfraEvidenceDiagramOutlineResourceName(node),
  ];

  return values
    .map((value) => normalizeDiagramFocusToken(value))
    .filter((token) => token.length > 0);
}

function outlineNodeMatchesDomFocus(
  node: InfraEvidenceMermaidOutlineNode,
  domSlug: string,
  titleTokens: readonly string[],
): boolean {
  const nodeTokens = outlineNodeFocusTokens(node);
  const normalizedDomSlug = normalizeDiagramFocusToken(domSlug);

  if (normalizedDomSlug.length > 0 && nodeTokens.includes(normalizedDomSlug)) {
    return true;
  }

  return titleTokens.some((token) => nodeTokens.includes(token));
}

export function normalizeDiagramFocusToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}