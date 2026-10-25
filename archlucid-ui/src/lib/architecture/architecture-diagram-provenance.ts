import type {
  ArchitectureDiagramEdge,
  ArchitectureDiagramModel,
  ArchitectureDiagramNode,
  ArchitectureDiagramVersionSource,
} from "@/lib/architecture/architecture-diagram-types";

export type ArchitectureDiagramElementKind = "node" | "edge";

export type ArchitectureDiagramProvenanceClass =
  | "evidence-backed"
  | "accepted-inference"
  | "inferred"
  | "user-drawn";

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

export const ARCHITECTURE_DIAGRAM_USER_EDIT_VERSION_HONESTY =
  "This diagram version was edited by an architect. That edit does not by itself show that this component was drawn by hand." as const;

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
  _diagramVersionSource: ArchitectureDiagramVersionSource | null,
): ArchitectureDiagramProvenanceClass {
  if (node.provenance === "inferred" && node.accepted) {
    return "accepted-inference";
  }

  if (node.provenance === "asserted") {
    return "evidence-backed";
  }

  return "inferred";
}

export function resolveEdgeProvenanceClass(
  edge: ArchitectureDiagramEdge,
  _diagramVersionSource: ArchitectureDiagramVersionSource | null,
): ArchitectureDiagramProvenanceClass {
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

  if (provenanceClass === "evidence-backed" || provenanceClass === "accepted-inference") {
    return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?reviewTab=evidence`;
  }

  return null;
}

export function buildArchitectureDiagramNodeProvenanceDetail(input: {
  readonly runId: string;
  readonly node: ArchitectureDiagramNode;
  readonly diagramVersionSource: ArchitectureDiagramVersionSource | null;
}): ArchitectureDiagramElementProvenanceDetail {
  const provenanceClass = resolveNodeProvenanceClass(input.node, input.diagramVersionSource);
  const displayLabel = resolveArchitectureDiagramNodeDisplayLabel(input.node.label);
  const sentence = buildProvenanceSentence(
    "node",
    displayLabel,
    provenanceClass,
    input.diagramVersionSource,
  );

  return {
    kind: "node",
    elementId: input.node.id,
    label: displayLabel,
    provenanceClass,
    sentence,
    sourceHref: buildEvidenceSourceHref(input.runId, provenanceClass),
  };
}

export const ARCHITECTURE_DIAGRAM_CONNECTION_LABEL_NOT_STORED =
  "Connection label was not stored." as const;

export const ARCHITECTURE_DIAGRAM_CONNECTION_LABEL_STORED_EMPTY =
  "Connection label was stored empty." as const;

export const ARCHITECTURE_DIAGRAM_NODE_LABEL_NOT_STORED = "Node label was not stored." as const;

export const ARCHITECTURE_DIAGRAM_NODE_LABEL_STORED_EMPTY = "Node label was stored empty." as const;

export const ARCHITECTURE_DIAGRAM_REVIEW_ID_NOT_STORED_EVIDENCE_LINK =
  "Review id was not stored, so the evidence link is not available." as const;

export function resolveArchitectureDiagramNodeDisplayLabel(label: string): string {
  if (label.length === 0) {
    return ARCHITECTURE_DIAGRAM_NODE_LABEL_NOT_STORED;
  }

  if (label.trim().length === 0) {
    return ARCHITECTURE_DIAGRAM_NODE_LABEL_STORED_EMPTY;
  }

  return label;
}

function resolveArchitectureDiagramEdgeDisplayLabel(edge: ArchitectureDiagramEdge): string {
  if (edge.label.length === 0) {
    return ARCHITECTURE_DIAGRAM_CONNECTION_LABEL_NOT_STORED;
  }

  if (edge.label.trim().length === 0) {
    return ARCHITECTURE_DIAGRAM_CONNECTION_LABEL_STORED_EMPTY;
  }

  return edge.label;
}

export function buildArchitectureDiagramEdgeProvenanceDetail(input: {
  readonly runId: string;
  readonly edge: ArchitectureDiagramEdge;
  readonly diagramVersionSource: ArchitectureDiagramVersionSource | null;
}): ArchitectureDiagramElementProvenanceDetail {
  const provenanceClass = resolveEdgeProvenanceClass(input.edge, input.diagramVersionSource);
  const displayLabel = resolveArchitectureDiagramEdgeDisplayLabel(input.edge);
  const sentence = buildProvenanceSentence(
    "edge",
    displayLabel,
    provenanceClass,
    input.diagramVersionSource,
  );

  return {
    kind: "edge",
    elementId: input.edge.id,
    label: displayLabel,
    provenanceClass,
    sentence,
    sourceHref: buildEvidenceSourceHref(input.runId, provenanceClass),
  };
}

function buildProvenanceSentence(
  kind: ArchitectureDiagramElementKind,
  label: string,
  provenanceClass: ArchitectureDiagramProvenanceClass,
  diagramVersionSource: ArchitectureDiagramVersionSource | null,
): string {
  const subject = kind === "node" ? "This component" : "This connection";
  let core: string;

  if (provenanceClass === "accepted-inference") {
    core = `${subject} (${label}) was inferred from the brief and accepted for this review.`;
  } else if (provenanceClass === "evidence-backed") {
    core = `${subject} (${label}) is backed by asserted architecture content or evidence on this review.`;
  } else {
    core = `${subject} (${label}) was inferred from the architecture brief and still needs architect confirmation before export.`;
  }

  if (diagramVersionSource === "regenerated") {
    return `This diagram version was regenerated. ${core}`;
  }

  return core;
}

export function listSelectableArchitectureDiagramElements(
  model: ArchitectureDiagramModel,
): readonly { readonly kind: ArchitectureDiagramElementKind; readonly id: string; readonly label: string }[] {
  const nodes = model.nodes
    .filter((node) => !node.removed)
    .map((node) => ({
      kind: "node" as const,
      id: node.id,
      label: resolveArchitectureDiagramNodeDisplayLabel(node.label),
    }));
  const edges = model.edges
    .filter((edge) => !edge.removed)
    .map((edge) => ({
      kind: "edge" as const,
      id: edge.id,
      label: resolveArchitectureDiagramEdgeDisplayLabel(edge),
    }));

  return [...nodes, ...edges];
}
