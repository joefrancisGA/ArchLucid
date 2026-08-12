import type { ArchitectureContentProvenance, ArchitectureStructuredEntity, ArchitectureStructuredParseResult } from "@/lib/architecture/architecture-structured-content-types";
import type {
  ArchitectureDiagramEdge,
  ArchitectureDiagramModel,
  ArchitectureDiagramNode,
  ArchitectureDiagramNodeKind,
} from "@/lib/architecture/architecture-diagram-types";

const FLOW_SPLIT_PATTERN = /\s*(?:->|→|—>|–>|to)\s*/i;

function sanitizeNodeId(label: string, kind: ArchitectureDiagramNodeKind, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  return `${kind}_${base.length > 0 ? base : `node_${index}`}`;
}

function createNode(
  label: string,
  kind: ArchitectureDiagramNodeKind,
  provenance: ArchitectureContentProvenance,
  usedIds: Set<string>,
  index: number,
): ArchitectureDiagramNode {
  let candidate = sanitizeNodeId(label, kind, index);
  let suffix = 0;

  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${sanitizeNodeId(label, kind, index)}_${suffix}`;
  }

  usedIds.add(candidate);

  return {
    id: candidate,
    label: label.trim(),
    kind,
    provenance,
    removed: false,
    accepted: provenance === "asserted",
  };
}

function addEntityNodes(
  entities: readonly ArchitectureStructuredEntity[],
  kind: ArchitectureDiagramNodeKind,
  nodes: ArchitectureDiagramNode[],
  usedIds: Set<string>,
): void {
  let index = nodes.length;

  for (const entity of entities) {
    if (entity.label.trim().length === 0) {
      continue;
    }

    nodes.push(createNode(entity.label, kind, entity.provenance, usedIds, index));
    index += 1;
  }
}

function findNodeIdByLabel(nodes: readonly ArchitectureDiagramNode[], label: string): string | null {
  const normalized = label.trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  const match = nodes.find((node) => !node.removed && node.label.trim().toLowerCase() === normalized);

  return match?.id ?? null;
}

function parseFlowEndpoints(
  text: string,
  nodes: readonly ArchitectureDiagramNode[],
): { readonly sourceId: string; readonly targetId: string; readonly label: string } | null {
  const parts = text.split(FLOW_SPLIT_PATTERN).map((part) => part.trim()).filter((part) => part.length > 0);

  if (parts.length < 2) {
    return null;
  }

  const sourceLabel = parts[0] ?? "";
  const targetLabel = parts[1] ?? "";
  const sourceId = findNodeIdByLabel(nodes, sourceLabel);
  const targetId = findNodeIdByLabel(nodes, targetLabel);

  if (sourceId === null || targetId === null || sourceId === targetId) {
    return null;
  }

  const label = parts.slice(2).join(" ").trim();

  return {
    sourceId,
    targetId,
    label,
  };
}

function addFlowEdges(
  parseResult: ArchitectureStructuredParseResult,
  nodes: readonly ArchitectureDiagramNode[],
  edges: ArchitectureDiagramEdge[],
): void {
  const flowSection = parseResult.sections.find((section) => section.key === "data-flows");

  if (flowSection === undefined) {
    return;
  }

  let edgeIndex = edges.length;

  for (const entity of flowSection.entities) {
    const combined = entity.detail !== null && entity.detail.length > 0 ? `${entity.label} -> ${entity.detail}` : entity.label;
    const endpoints = parseFlowEndpoints(combined, nodes);

    if (endpoints === null) {
      continue;
    }

    edges.push({
      id: `edge_${edgeIndex}`,
      sourceId: endpoints.sourceId,
      targetId: endpoints.targetId,
      label: endpoints.label.length > 0 ? endpoints.label : "data flow",
      provenance: entity.provenance,
      removed: false,
    });
    edgeIndex += 1;
  }

  if (flowSection.narrativeMarkdown !== null) {
    const lines = flowSection.narrativeMarkdown.split(/\r?\n/);

    for (const line of lines) {
      const endpoints = parseFlowEndpoints(line, nodes);

      if (endpoints === null) {
        continue;
      }

      edges.push({
        id: `edge_${edgeIndex}`,
        sourceId: endpoints.sourceId,
        targetId: endpoints.targetId,
        label: endpoints.label.length > 0 ? endpoints.label : "data flow",
        provenance: flowSection.provenance,
        removed: false,
      });
      edgeIndex += 1;
    }
  }
}

export function buildArchitectureDiagramModel(
  parseResult: ArchitectureStructuredParseResult,
  architectureName: string,
): ArchitectureDiagramModel {
  const byKey = new Map(parseResult.sections.map((section) => [section.key, section]));
  const nodes: ArchitectureDiagramNode[] = [];
  const edges: ArchitectureDiagramEdge[] = [];
  const usedIds = new Set<string>();

  addEntityNodes(byKey.get("users-and-stakeholders")?.entities ?? [], "user", nodes, usedIds);
  addEntityNodes(byKey.get("systems-and-services")?.entities ?? [], "system", nodes, usedIds);
  addEntityNodes(byKey.get("external-integrations")?.entities ?? [], "external", nodes, usedIds);

  const trimmedName = architectureName.trim();

  if (trimmedName.length > 0 && trimmedName.toLowerCase() !== "untitled architecture") {
    const alreadyPresent = nodes.some((node) => node.label.toLowerCase() === trimmedName.toLowerCase());

    if (!alreadyPresent) {
      nodes.push(createNode(trimmedName, "system", "asserted", usedIds, nodes.length));
    }
  }

  addFlowEdges(parseResult, nodes, edges);

  const trustBoundaryLabels =
    byKey.get("trust-boundaries")?.entities.map((entity) => entity.label).filter((label) => label.trim().length > 0) ?? [];

  return {
    nodes,
    edges,
    trustBoundaryLabels,
  };
}

export function applyArchitectureDiagramOverrides(
  model: ArchitectureDiagramModel,
  nodeOverrides: readonly ArchitectureDiagramNode[],
  edgeOverrides: readonly ArchitectureDiagramEdge[],
): ArchitectureDiagramModel {
  const nodeOverrideMap = new Map(nodeOverrides.map((node) => [node.id, node]));
  const edgeOverrideMap = new Map(edgeOverrides.map((edge) => [edge.id, edge]));

  return {
    nodes: model.nodes.map((node) => nodeOverrideMap.get(node.id) ?? node),
    edges: model.edges
      .map((edge) => edgeOverrideMap.get(edge.id) ?? edge)
      .filter((edge) => !edge.removed),
    trustBoundaryLabels: model.trustBoundaryLabels,
  };
}
