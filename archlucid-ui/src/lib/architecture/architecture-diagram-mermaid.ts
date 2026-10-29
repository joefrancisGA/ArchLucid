import {
  ARCHITECTURE_DIAGRAM_ACCEPTED_INFERENCE_SUFFIX,
  ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX,
  ARCHITECTURE_DIAGRAM_CONNECTIONS_LEFT_OFF_PREFIX,
  ARCHITECTURE_DIAGRAM_TEXT_ALTERNATIVE_LIST_CAP,
  formatArchitectureDiagramTextAlternativeOverflowNotice,
  formatArchitectureDiagramUnlabeledComponentsNotice,
  formatUnmatchedArchitectureDataFlowLine,
} from "@/lib/architecture/architecture-diagram-copy";
import type { ArchitectureDiagramModel, ArchitectureDiagramNode } from "@/lib/architecture/architecture-diagram-types";
import {
  resolveArchitectureDiagramEdgeDisplayLabel,
  resolveArchitectureDiagramNodeDisplayLabel,
} from "@/lib/architecture/architecture-diagram-provenance";
import { wrapArchitectureDiagramLabelForMermaidSource } from "@/lib/architecture/wrap-architecture-diagram-label";
import {
  formatStoredTextPreview,
  STORED_TEXT_PREVIEW_CONTINUATION,
} from "@/lib/format-stored-text-preview";

const NO_ARCHITECTURE_COMPONENTS_RECORDED = "No diagram components were stored.";

const ARCHITECTURE_DIAGRAM_TEXT_ALT_SECTION_BY_KIND: Record<ArchitectureDiagramNode["kind"], string> = {
  user: "Users and stakeholders:",
  system: "Systems and services:",
  external: "External integrations:",
  boundary: "Trust boundaries:",
};

function architectureDiagramTextAlternativeSectionPrefix(kind: ArchitectureDiagramNode["kind"]): string {
  return ARCHITECTURE_DIAGRAM_TEXT_ALT_SECTION_BY_KIND[kind];
}

export const RECORDED_ARCHITECTURE_COMPONENTS_REMOVED_FROM_DIAGRAM =
  "Recorded architecture components were removed from this diagram." as const;

export const ARCHITECTURE_DIAGRAM_DANGLING_CONNECTION_OMITTED =
  "A connection was left off this diagram because an endpoint was not on the diagram." as const;

function resolveEmptyArchitectureDiagramMessage(model: ArchitectureDiagramModel): string {
  if (model.nodes.length > 0 && model.nodes.every((node) => node.removed)) {
    return RECORDED_ARCHITECTURE_COMPONENTS_REMOVED_FROM_DIAGRAM;
  }

  return NO_ARCHITECTURE_COMPONENTS_RECORDED;
}

export type ArchitectureDiagramMermaidOptions = {
  readonly dark?: boolean;
};

const MERMAID_LABEL_MAX_CHARS = 160;
const MERMAID_INFERRED_SUFFIX = ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX;
const MERMAID_ACCEPTED_INFERENCE_SUFFIX = ARCHITECTURE_DIAGRAM_ACCEPTED_INFERENCE_SUFFIX;

function architectureDiagramNodeProvenanceSuffix(node: ArchitectureDiagramNode): string {
  if (node.provenance !== "inferred") {
    return "";
  }

  return node.accepted ? MERMAID_ACCEPTED_INFERENCE_SUFFIX : MERMAID_INFERRED_SUFFIX;
}

function escapeMermaidLabel(raw: string, peerResourceNames: readonly string[]): string {
  const singleLine = raw.replace(/\s+/g, " ").trim();
  const escaped = singleLine.replace(/"/g, "'");
  const hasInferredSuffix =
    escaped.endsWith(MERMAID_INFERRED_SUFFIX) || escaped.endsWith(MERMAID_ACCEPTED_INFERENCE_SUFFIX);
  const suffix = escaped.endsWith(MERMAID_ACCEPTED_INFERENCE_SUFFIX)
    ? MERMAID_ACCEPTED_INFERENCE_SUFFIX
    : escaped.endsWith(MERMAID_INFERRED_SUFFIX)
      ? MERMAID_INFERRED_SUFFIX
      : "";
  const core = hasInferredSuffix ? escaped.slice(0, -suffix.length) : escaped;
  const maxCoreLength = hasInferredSuffix ? MERMAID_LABEL_MAX_CHARS - suffix.length : MERMAID_LABEL_MAX_CHARS;
  const truncatedCore =
    core.length > maxCoreLength
      ? formatStoredTextPreview(core, maxCoreLength, STORED_TEXT_PREVIEW_CONTINUATION.mermaidNodeLabel)
      : core;
  const label = hasInferredSuffix ? `${truncatedCore}${suffix}` : truncatedCore;

  return wrapArchitectureDiagramLabelForMermaidSource(label, peerResourceNames);
}

function nodeClassNames(node: ArchitectureDiagramNode): string {
  if (node.provenance === "asserted") {
    return "assertedNode";
  }

  return "inferredNode";
}

function mermaidClassDefLines(dark: boolean): string[] {
  if (dark) {
    return [
      "  classDef assertedNode fill:#134e4a,stroke:#2dd4bf,stroke-width:2px,color:#f8fafc",
      "  classDef inferredNode fill:#1e293b,stroke:#94a3b8,stroke-width:1px,stroke-dasharray:5 5,color:#f8fafc",
    ];
  }

  return [
    "  classDef assertedNode fill:#ecfeff,stroke:#0f766e,stroke-width:2px,color:#0f172a",
    "  classDef inferredNode fill:#f8fafc,stroke:#64748b,stroke-width:1px,stroke-dasharray:5 5,color:#0f172a",
  ];
}

function renderNodeLine(
  node: ArchitectureDiagramNode,
  indent: string,
  peerResourceNames: readonly string[],
): string {
  const className = nodeClassNames(node);
  const suffix = architectureDiagramNodeProvenanceSuffix(node);
  const displayLabel = resolveArchitectureDiagramNodeDisplayLabel(node.label);
  const label = escapeMermaidLabel(`${displayLabel}${suffix}`, peerResourceNames);

  return `${indent}${node.id}["${label}"]:::${className}`;
}

export function architectureDiagramModelToMermaid(
  model: ArchitectureDiagramModel,
  options: ArchitectureDiagramMermaidOptions = {},
): string {
  const lines: string[] = ["flowchart TB"];
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const dark = options.dark ?? false;
  const peerResourceNames = activeNodes.map((node) => node.label);

  if (activeNodes.length === 0) {
    const emptyLabel = escapeMermaidLabel(resolveEmptyArchitectureDiagramMessage(model), []);
    return `flowchart TB\n  empty["${emptyLabel}"]\n`;
  }

  lines.push(...mermaidClassDefLines(dark));

  for (const node of activeNodes) {
    lines.push(renderNodeLine(node, "  ", peerResourceNames));
  }

  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const danglingEdgeOmitted = activeEdges.some(
    (edge) =>
      !activeNodes.some((node) => node.id === edge.sourceId)
      || !activeNodes.some((node) => node.id === edge.targetId),
  );

  for (const edge of activeEdges) {
    const sourceExists = activeNodes.some((node) => node.id === edge.sourceId);
    const targetExists = activeNodes.some((node) => node.id === edge.targetId);

    if (!sourceExists || !targetExists) {
      continue;
    }

    const inferredSuffix =
      edge.provenance === "inferred" ? ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX : "";
    const displayLabel = resolveArchitectureDiagramEdgeDisplayLabel(edge);
    const label = escapeMermaidLabel(`${displayLabel}${inferredSuffix}`, peerResourceNames);
    const edgeStyle = edge.provenance === "inferred" ? "-.->" : "-->";

    lines.push(`  ${edge.sourceId} ${edgeStyle}|"${label}"| ${edge.targetId}`);
  }

  if (danglingEdgeOmitted) {
    const omissionLabel = escapeMermaidLabel(ARCHITECTURE_DIAGRAM_DANGLING_CONNECTION_OMITTED, peerResourceNames);
    lines.push(`  diagramOmissionNote["${omissionLabel}"]:::inferredNode`);
  }

  return `${lines.join("\n")}\n`;
}

export function architectureDiagramModelToTextAlternative(model: ArchitectureDiagramModel): string {
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const nodeLabelById = new Map(activeNodes.map((node) => [node.id, node.label]));
  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const renderedEdges = activeEdges.filter(
    (edge) => nodeLabelById.has(edge.sourceId) && nodeLabelById.has(edge.targetId),
  );
  const omittedConnectionCount = activeEdges.length - renderedEdges.length;
  const danglingEdgeOmitted = activeEdges.some(
    (edge) => !nodeLabelById.has(edge.sourceId) || !nodeLabelById.has(edge.targetId),
  );
  const boundaryLine =
    model.trustBoundaryLabels.length > 0 ? `Trust boundaries: ${model.trustBoundaryLabels.join(", ")}` : null;
  const unmatchedLines = model.unmatchedDataFlows.map((flow) => formatUnmatchedArchitectureDataFlowLine(flow));
  const skippedUnlabeledLine =
    model.skippedUnlabeledEntityCount > 0
      ? formatArchitectureDiagramUnlabeledComponentsNotice(model.skippedUnlabeledEntityCount)
      : null;
  const tailParts = [
    boundaryLine,
    skippedUnlabeledLine,
    danglingEdgeOmitted ? ARCHITECTURE_DIAGRAM_DANGLING_CONNECTION_OMITTED : null,
    ...(model.entitySectionHonestyLines ?? []),
    ...(model.diagramHonestyNotes ?? []),
    ...unmatchedLines,
  ].filter((line): line is string => line !== null && line.length > 0);

  if (activeNodes.length === 0) {
    const sectionHonesty = (model.entitySectionHonestyLines ?? []).filter((line) => line.length > 0);
    const omittedSectionLines = sectionHonesty.filter((line) => line.includes("Entities were not stored."));

    if (omittedSectionLines.length > 0) {
      return omittedSectionLines.join(". ");
    }

    const head =
      sectionHonesty.length > 0
        ? [resolveEmptyArchitectureDiagramMessage(model), ...sectionHonesty].join(". ")
        : resolveEmptyArchitectureDiagramMessage(model);

    const nonEntityTail = tailParts.filter(
      (line) => !(model.entitySectionHonestyLines ?? []).includes(line),
    );

    return nonEntityTail.length > 0 ? [head, ...nonEntityTail].join(". ") : head;
  }

  const nodeLines = activeNodes.map((node) => {
    const inferred = architectureDiagramNodeProvenanceSuffix(node);
    const displayLabel = resolveArchitectureDiagramNodeDisplayLabel(node.label);

    return `${architectureDiagramTextAlternativeSectionPrefix(node.kind)} ${displayLabel}${inferred}`;
  });
  const edgeLinesAll = renderedEdges.map((edge) => {
    const sourceLabel = resolveArchitectureDiagramNodeDisplayLabel(
      nodeLabelById.get(edge.sourceId) ?? edge.sourceId,
    );
    const targetLabel = resolveArchitectureDiagramNodeDisplayLabel(
      nodeLabelById.get(edge.targetId) ?? edge.targetId,
    );
    const inferred =
      edge.provenance === "inferred" ? ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX : "";
    const displayEdgeLabel = resolveArchitectureDiagramEdgeDisplayLabel(edge);
    const detail =
      displayEdgeLabel === "Connection label was not stored." ||
      displayEdgeLabel === "Connection label was stored empty."
        ? ` (${displayEdgeLabel})`
        : displayEdgeLabel.length > 0
          ? ` (${displayEdgeLabel})`
          : "";

    return `${sourceLabel} to ${targetLabel}${detail}${inferred}`;
  });
  const cappedNodeLines = nodeLines.slice(0, ARCHITECTURE_DIAGRAM_TEXT_ALTERNATIVE_LIST_CAP);
  const cappedEdgeLines = edgeLinesAll.slice(0, ARCHITECTURE_DIAGRAM_TEXT_ALTERNATIVE_LIST_CAP);
  const overflowNotice = formatArchitectureDiagramTextAlternativeOverflowNotice(
    Math.max(0, nodeLines.length - cappedNodeLines.length),
    Math.max(0, edgeLinesAll.length - cappedEdgeLines.length),
  );
  const edgeLines = cappedEdgeLines;

  const danglingEdgeLine = danglingEdgeOmitted ? ARCHITECTURE_DIAGRAM_DANGLING_CONNECTION_OMITTED : null;
  const omittedConnectionLine =
    omittedConnectionCount > 0
      ? `${ARCHITECTURE_DIAGRAM_CONNECTIONS_LEFT_OFF_PREFIX} ${omittedConnectionCount}`
      : null;

  return [
    cappedNodeLines.join("; "),
    edgeLines.join("; "),
    boundaryLine,
    skippedUnlabeledLine,
    danglingEdgeLine,
    omittedConnectionLine,
    overflowNotice.length > 0 ? overflowNotice : null,
    ...(model.entitySectionHonestyLines ?? []),
    ...(model.diagramHonestyNotes ?? []),
    ...unmatchedLines,
  ]
    .filter((line): line is string => line !== null && line.length > 0)
    .join(". ");
}

export function isValidMermaidArchitectureDiagram(source: string): boolean {
  const trimmed = source.trim();

  return trimmed.startsWith("flowchart") || trimmed.startsWith("graph ");
}
