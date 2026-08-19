import type {
  ArchitectureDiagramEdge,
  ArchitectureDiagramModel,
  ArchitectureDiagramNode,
  ArchitectureDiagramVersionSource,
} from "@/lib/architecture/architecture-diagram-types";

export type ArchitectureDiagramElementKind = "node" | "edge";

export type ArchitectureDiagramProvenanceClass = "evidence-backed" | "inferred" | "user-drawn";

export type ArchitectureDiagramElementProvenanceDetail = {
  readonly kind: ArchitectureDiagramElementKind;
  readonly elementId: string;
  readonly label: string;
  readonly provenanceClass: ArchitectureDiagramProvenanceClass;
  readonly sentence: string;
  readonly sourceHref: string | null;
};

export type ArchitectureDiagramProvenanceSummary = {
  readonly assertedNodeCount: number;
  readonly inferredNodeCount: number;
  readonly assertedEdgeCount: number;
  readonly inferredEdgeCount: number;
  readonly unconfirmedInferredCount: number;
};

export function summarizeArchitectureDiagramProvenance(
  model: ArchitectureDiagramModel | null,
): ArchitectureDiagramProvenanceSummary {
  if (model === null) {
    return {
      assertedNodeCount: 0,
      inferredNodeCount: 0,
      assertedEdgeCount: 0,
      inferredEdgeCount: 0,
      unconfirmedInferredCount: 0,
    };
  }

  const activeNodes = model.nodes.filter((node) => !node.removed);
  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const assertedNodeCount = activeNodes.filter((node) => node.provenance === "asserted" || node.accepted).length;
  const inferredNodeCount = activeNodes.filter(
    (node) => node.provenance === "inferred" && !node.accepted,
  ).length;
  const assertedEdgeCount = activeEdges.filter((edge) => edge.provenance === "asserted").length;
  const inferredEdgeCount = activeEdges.filter((edge) => edge.provenance === "inferred").length;

  return {
    assertedNodeCount,
    inferredNodeCount,
    assertedEdgeCount,
    inferredEdgeCount,
    unconfirmedInferredCount: inferredNodeCount + inferredEdgeCount,
  };
}

export function resolveNodeProvenanceClass(
  node: ArchitectureDiagramNode,
  diagramVersionSource: ArchitectureDiagramVersionSource | null,
): ArchitectureDiagramProvenanceClass {
  if (diagramVersionSource === "user-edit") {
    return "user-drawn";
  }

  if (node.provenance === "asserted" || node.accepted) {
    return "evidence-backed";
  }

  return "inferred";
}

export function resolveEdgeProvenanceClass(
  edge: ArchitectureDiagramEdge,
  diagramVersionSource: ArchitectureDiagramVersionSource | null,
): ArchitectureDiagramProvenanceClass {
  if (diagramVersionSource === "user-edit") {
    return "user-drawn";
  }

  if (edge.provenance === "asserted") {
    return "evidence-backed";
  }

  return "inferred";
}

function buildEvidenceSourceHref(runId: string, provenanceClass: ArchitectureDiagramProvenanceClass): string | null {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0 || provenanceClass === "user-drawn") {
    return null;
  }

  if (provenanceClass === "inferred") {
    return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?reviewTab=findings`;
  }

  return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?reviewTab=evidence`;
}

export function buildArchitectureDiagramNodeProvenanceDetail(input: {
  readonly runId: string;
  readonly node: ArchitectureDiagramNode;
  readonly diagramVersionSource: ArchitectureDiagramVersionSource | null;
}): ArchitectureDiagramElementProvenanceDetail {
  const provenanceClass = resolveNodeProvenanceClass(input.node, input.diagramVersionSource);
  const sentence = buildProvenanceSentence("node", input.node.label, provenanceClass, input.node.accepted);

  return {
    kind: "node",
    elementId: input.node.id,
    label: input.node.label,
    provenanceClass,
    sentence,
    sourceHref: buildEvidenceSourceHref(input.runId, provenanceClass),
  };
}

export function buildArchitectureDiagramEdgeProvenanceDetail(input: {
  readonly runId: string;
  readonly edge: ArchitectureDiagramEdge;
  readonly diagramVersionSource: ArchitectureDiagramVersionSource | null;
}): ArchitectureDiagramElementProvenanceDetail {
  const provenanceClass = resolveEdgeProvenanceClass(input.edge, input.diagramVersionSource);
  const sentence = buildProvenanceSentence("edge", input.edge.label, provenanceClass, false);

  return {
    kind: "edge",
    elementId: input.edge.id,
    label: input.edge.label.length > 0 ? input.edge.label : `${input.edge.sourceId} → ${input.edge.targetId}`,
    provenanceClass,
    sentence,
    sourceHref: buildEvidenceSourceHref(input.runId, provenanceClass),
  };
}

function buildProvenanceSentence(
  kind: ArchitectureDiagramElementKind,
  label: string,
  provenanceClass: ArchitectureDiagramProvenanceClass,
  accepted: boolean,
): string {
  const subject = kind === "node" ? "This component" : "This connection";

  if (provenanceClass === "user-drawn") {
    return `${subject} (${label}) was placed or edited by an architect in the diagram editor — it is not auto-generated from evidence.`;
  }

  if (provenanceClass === "evidence-backed") {
    if (accepted) {
      return `${subject} (${label}) was inferred from the brief and accepted as evidence-backed for this review.`;
    }

    return `${subject} (${label}) is backed by asserted architecture content or evidence on this review.`;
  }

  return `${subject} (${label}) was inferred from the architecture brief and still needs architect confirmation before export.`;
}

export function listSelectableArchitectureDiagramElements(
  model: ArchitectureDiagramModel,
): readonly { readonly kind: ArchitectureDiagramElementKind; readonly id: string; readonly label: string }[] {
  const nodes = model.nodes
    .filter((node) => !node.removed)
    .map((node) => ({ kind: "node" as const, id: node.id, label: node.label }));
  const edges = model.edges
    .filter((edge) => !edge.removed)
    .map((edge) => ({
      kind: "edge" as const,
      id: edge.id,
      label: edge.label.length > 0 ? edge.label : `${edge.sourceId} → ${edge.targetId}`,
    }));

  return [...nodes, ...edges];
}
