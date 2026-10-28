import type {
  ArchitectureDiagramEdge,
  ArchitectureDiagramModel,
  ArchitectureDiagramNode,
  ArchitectureDiagramVersionSource,
} from "@/lib/architecture/architecture-diagram-types";

export type ArchitectureDiagramElementKind = "node" | "edge";

export type ArchitectureDiagramProvenanceClass =
  | "brief-asserted"
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
  readonly acceptedInferenceNodeCount: number;
  readonly inferredNodeCount: number;
  readonly assertedEdgeCount: number;
  readonly inferredEdgeCount: number;
  readonly unconfirmedInferredCount: number;
};

export const ARCHITECTURE_DIAGRAM_USER_EDIT_VERSION_HONESTY =
  "This diagram version was edited by an architect. That edit does not by itself show that this component was drawn by hand." as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED =
  "Diagram provenance was not loaded — counts are not available on this surface." as const;

export const ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_EMPTY =
  "Diagram model was stored empty — no components or lines to count." as const;

export function summarizeArchitectureDiagramProvenance(
  model: ArchitectureDiagramModel | null,
): ArchitectureDiagramProvenanceSummary {
  if (model === null) {
    return {
      assertedNodeCount: 0,
      acceptedInferenceNodeCount: 0,
      inferredNodeCount: 0,
      assertedEdgeCount: 0,
      inferredEdgeCount: 0,
      unconfirmedInferredCount: 0,
    };
  }

  const activeNodes = model.nodes.filter((node) => !node.removed);
  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const assertedNodeCount = activeNodes.filter((node) => node.provenance === "asserted").length;
  const acceptedInferenceNodeCount = activeNodes.filter(
    (node) => node.provenance === "inferred" && node.accepted,
  ).length;
  const inferredNodeCount = activeNodes.filter(
    (node) => node.provenance === "inferred" && !node.accepted,
  ).length;
  const assertedEdgeCount = activeEdges.filter((edge) => edge.provenance === "asserted").length;
  const inferredEdgeCount = activeEdges.filter((edge) => edge.provenance === "inferred").length;

  return {
    assertedNodeCount,
    acceptedInferenceNodeCount,
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
    return "brief-asserted";
  }

  return "inferred";
}

export function resolveEdgeProvenanceClass(
  edge: ArchitectureDiagramEdge,
  _diagramVersionSource: ArchitectureDiagramVersionSource | null,
): ArchitectureDiagramProvenanceClass {
  if (edge.provenance === "asserted") {
    return "brief-asserted";
  }

  return "inferred";
}

function buildEvidenceSourceHref(_runId: string, _provenanceClass: ArchitectureDiagramProvenanceClass): string | null {
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

export const ARCHITECTURE_DIAGRAM_EVIDENCE_ITEM_ID_NOT_STORED_ON_COMPONENT =
  "No evidence item id was stored on this component." as const;

export const ARCHITECTURE_DIAGRAM_OPEN_SUBMITTED_EVIDENCE_LINK_LABEL =
  "Open submitted evidence for this review." as const;

export const ARCHITECTURE_DIAGRAM_VERSION_SOURCE_NOT_STORED =
  "Diagram version source was not stored." as const;

export function resolveArchitectureDiagramNodeDisplayLabel(label: string): string {
  if (label.length === 0) {
    return ARCHITECTURE_DIAGRAM_NODE_LABEL_NOT_STORED;
  }

  if (label.trim().length === 0) {
    return ARCHITECTURE_DIAGRAM_NODE_LABEL_STORED_EMPTY;
  }

  return label;
}

export function resolveArchitectureDiagramEdgeDisplayLabel(edge: ArchitectureDiagramEdge): string {
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
    core = `${subject} (${label}) was accepted on this diagram. A source evidence link was not stored.`;
  } else if (provenanceClass === "brief-asserted") {
    core = `${subject} (${label}) was asserted in the brief. An evidence artifact link was not stored.`;
  } else {
    core = `${subject} (${label}) was marked inferred and still needs architect confirmation before export. An inference source was not stored on the element.`;
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
