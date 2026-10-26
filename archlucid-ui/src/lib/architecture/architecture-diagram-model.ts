import {
  formatReviewTitleNotCollectedSystemNote,
  formatTrustBoundaryWithoutMembershipNote,
} from "@/lib/architecture/architecture-diagram-copy";
import { architectureNameAddsDiagramNode } from "@/lib/architecture/architecture-diagram-named-node";
import { ARCHITECTURE_DIAGRAM_NODE_LABEL_NOT_STORED } from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureContentProvenance, ArchitectureStructuredEntity, ArchitectureStructuredParseResult } from "@/lib/architecture/architecture-structured-content-types";
import type {
  ArchitectureDiagramEdge,
  ArchitectureDiagramModel,
  ArchitectureDiagramNode,
  ArchitectureDiagramNodeKind,
} from "@/lib/architecture/architecture-diagram-types";

const FLOW_SPLIT_PATTERN = /\s*(?:->|→|—>|–>|\bto\b)\s*/i;

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
  skippedUnlabeled: { count: number },
): void {
  let index = nodes.length;

  for (const entity of entities) {
    const trimmedLabel = entity.label.trim();
    const label = trimmedLabel.length > 0 ? trimmedLabel : ARCHITECTURE_DIAGRAM_NODE_LABEL_NOT_STORED;

    if (trimmedLabel.length === 0) {
      skippedUnlabeled.count += 1;
    }

    nodes.push(createNode(label, kind, entity.provenance, usedIds, index));
    index += 1;
  }
}

function findNodeIdByLabel(
  nodes: readonly ArchitectureDiagramNode[],
  label: string,
  options?: { readonly preferKind?: ArchitectureDiagramNodeKind },
): string | null {
  const normalized = label.trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  const matches = nodes.filter((node) => !node.removed && node.label.trim().toLowerCase() === normalized);

  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return matches[0]!.id;
  }

  if (options?.preferKind !== undefined) {
    const preferred = matches.find((node) => node.kind === options.preferKind);

    if (preferred !== undefined) {
      return preferred.id;
    }
  }

  return null;
}

function mergeEndpointLabels(
  parts: readonly string[],
  nodes: readonly ArchitectureDiagramNode[],
): readonly string[] {
  const merged: string[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    let current = parts[index]!;

    while (
      index + 1 < parts.length
      && findNodeIdByLabel(nodes, `${current} to ${parts[index + 1]!}`) !== null
    ) {
      current = `${current} to ${parts[index + 1]!}`;
      index += 1;
    }

    merged.push(current);
  }

  return merged;
}

type ParsedFlowEndpoint = {
  readonly sourceId: string;
  readonly targetId: string;
  readonly label: string;
};

function parseFlowEndpoints(
  text: string,
  nodes: readonly ArchitectureDiagramNode[],
): readonly ParsedFlowEndpoint[] {
  const parts = mergeEndpointLabels(
    text.split(FLOW_SPLIT_PATTERN).map((part) => part.trim()).filter((part) => part.length > 0),
    nodes,
  );

  if (parts.length < 2) {
    return [];
  }

  const nodeIds: Array<string | null> = [];
  let preferKind: ArchitectureDiagramNodeKind | undefined;

  for (const part of parts) {
    const nodeId = findNodeIdByLabel(nodes, part, preferKind === undefined ? undefined : { preferKind });
    nodeIds.push(nodeId);

    if (nodeId !== null) {
      preferKind = nodes.find((node) => node.id === nodeId)?.kind;
    }
  }

  const sourceId = nodeIds[0];
  const targetId = nodeIds[1];

  if (sourceId == null || targetId == null || sourceId === targetId) {
    return [];
  }

  let resolvedEndpointCount = 2;
  while (
    resolvedEndpointCount < nodeIds.length &&
    nodeIds[resolvedEndpointCount] != null &&
    nodeIds[resolvedEndpointCount] !== nodeIds[resolvedEndpointCount - 1]
  ) {
    resolvedEndpointCount += 1;
  }

  const edges: ParsedFlowEndpoint[] = [];
  for (let index = 0; index < resolvedEndpointCount - 1; index += 1) {
    edges.push({
      sourceId: nodeIds[index]!,
      targetId: nodeIds[index + 1]!,
      label: index === resolvedEndpointCount - 2 ? parts.slice(resolvedEndpointCount).join(" ").trim() : "",
    });
  }

  return edges;
}

const PIPE_DETAIL_COLUMN_SEPARATOR = " · ";

function resolveEntityFlowParseText(entity: ArchitectureStructuredEntity): {
  readonly flowText: string;
  readonly trailingEdgeLabel: string;
} {
  if (entity.detail === null || entity.detail.length === 0) {
    return { flowText: entity.label, trailingEdgeLabel: "" };
  }

  const separatorIndex = entity.detail.indexOf(PIPE_DETAIL_COLUMN_SEPARATOR);

  if (separatorIndex >= 0) {
    const target = entity.detail.slice(0, separatorIndex).trim();
    const trailingEdgeLabel = entity.detail.slice(separatorIndex + PIPE_DETAIL_COLUMN_SEPARATOR.length).trim();

    if (target.length > 0) {
      return {
        flowText: `${entity.label} -> ${target}`,
        trailingEdgeLabel,
      };
    }
  }

  return {
    flowText: `${entity.label} -> ${entity.detail}`,
    trailingEdgeLabel: "",
  };
}

const RELATIONSHIP_NOT_STORED_LABEL = "Relationship was not stored";
const RELATIONSHIP_ON_LAST_HOP_LABEL = "Relationship text was stored on the last hop of this chain.";

function resolveFlowEdgeLabel(
  endpoints: ParsedFlowEndpoint,
  parsedEndpoints: readonly ParsedFlowEndpoint[],
  trailingEdgeLabel: string,
): string {
  if (endpoints.label.length > 0) {
    return endpoints.label;
  }

  const lastEndpoint = parsedEndpoints[parsedEndpoints.length - 1];
  const lastHopHasStoredText =
    (lastEndpoint?.label.trim().length ?? 0) > 0 || trailingEdgeLabel.length > 0;

  if (parsedEndpoints.length > 1 && lastHopHasStoredText) {
    return RELATIONSHIP_ON_LAST_HOP_LABEL;
  }

  if (trailingEdgeLabel.length > 0) {
    return trailingEdgeLabel;
  }

  return RELATIONSHIP_NOT_STORED_LABEL;
}

function addFlowEdges(
  parseResult: ArchitectureStructuredParseResult,
  nodes: readonly ArchitectureDiagramNode[],
  edges: ArchitectureDiagramEdge[],
  unmatchedDataFlows: string[],
): void {
  const flowSection = parseResult.sections.find((section) => section.key === "data-flows");

  if (flowSection === undefined) {
    return;
  }

  let edgeIndex = edges.length;

  const recordUnmatchedFlow = (raw: string): void => {
    const normalized = raw.trim();

    if (normalized.length > 0) {
      unmatchedDataFlows.push(normalized);
    }
  };

  for (const entity of flowSection.entities ?? []) {
    const { flowText, trailingEdgeLabel } = resolveEntityFlowParseText(entity);
    const parsedEndpoints = parseFlowEndpoints(flowText, nodes);

    if (parsedEndpoints.length === 0) {
      recordUnmatchedFlow(flowText);
      continue;
    }

    for (const endpoints of parsedEndpoints) {
      const edgeLabel = resolveFlowEdgeLabel(endpoints, parsedEndpoints, trailingEdgeLabel);

      edges.push({
        id: `edge_${edgeIndex}`,
        sourceId: endpoints.sourceId,
        targetId: endpoints.targetId,
        label: edgeLabel,
        provenance: entity.provenance,
        removed: false,
      });
      edgeIndex += 1;
    }
  }

  if (flowSection.narrativeMarkdown !== null) {
    const lines = flowSection.narrativeMarkdown.split(/\r?\n/);

    for (const line of lines) {
      const parsedLineEndpoints = parseFlowEndpoints(line, nodes);

      if (parsedLineEndpoints.length === 0) {
        recordUnmatchedFlow(line);
        continue;
      }

      for (const endpoints of parsedLineEndpoints) {
        edges.push({
          id: `edge_${edgeIndex}`,
          sourceId: endpoints.sourceId,
          targetId: endpoints.targetId,
          label: resolveFlowEdgeLabel(endpoints, parsedLineEndpoints, ""),
          provenance: flowSection.provenance,
          removed: false,
        });
        edgeIndex += 1;
      }
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
  const unmatchedDataFlows: string[] = [];
  const diagramHonestyNotes: string[] = [];
  const usedIds = new Set<string>();
  const skippedUnlabeled = { count: 0 };

  addEntityNodes(byKey.get("users-and-stakeholders")?.entities ?? [], "user", nodes, usedIds, skippedUnlabeled);
  addEntityNodes(byKey.get("systems-and-services")?.entities ?? [], "system", nodes, usedIds, skippedUnlabeled);
  addEntityNodes(byKey.get("external-integrations")?.entities ?? [], "external", nodes, usedIds, skippedUnlabeled);

  if (architectureNameAddsDiagramNode(architectureName, nodes.map((node) => node.label))) {
    diagramHonestyNotes.push(formatReviewTitleNotCollectedSystemNote(architectureName.trim()));
  }

  addFlowEdges(parseResult, nodes, edges, unmatchedDataFlows);

  const trustBoundaryLabels =
    byKey.get("trust-boundaries")?.entities?.map((entity) => entity.label).filter((label) => label.trim().length > 0) ?? [];

  if (trustBoundaryLabels.length > 0) {
    diagramHonestyNotes.push(formatTrustBoundaryWithoutMembershipNote(trustBoundaryLabels));
  }

  return {
    nodes,
    edges,
    trustBoundaryLabels,
    skippedUnlabeledEntityCount: skippedUnlabeled.count,
    unmatchedDataFlows,
    diagramHonestyNotes,
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
    skippedUnlabeledEntityCount: model.skippedUnlabeledEntityCount,
    unmatchedDataFlows: model.unmatchedDataFlows,
    diagramHonestyNotes: model.diagramHonestyNotes,
  };
}
