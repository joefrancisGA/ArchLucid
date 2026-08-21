import { buyerLabelForProvenanceNode } from "@/lib/provenance-graph-presentation";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { provenanceGraphNodeTypeBuyerLabel } from "@/lib/citation-kind-buyer-label";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

export type ProvenanceNodeFilterCategory =
  | "findings"
  | "decisions"
  | "evidence"
  | "controls"
  | "governance"
  | "artifacts";

export type ProvenanceNodeVisualStyle = {
  layer: number;
  fill: string;
  stroke: string;
  shape: "circle" | "square" | "diamond";
  legendKey: string;
};

const LAYER_LABELS = [
  "Context and source evidence",
  "Findings",
  "Controls and mitigations",
  "Decisions",
  "Governance records",
  "Finalized review record",
  "Final artifacts",
] as const;

export function provenanceLayerLabels(): readonly string[] {
  return LAYER_LABELS;
}

/** Human-readable primary label for a provenance node (never raw internal id). */
export function provenanceNodeDisplayName(node: ArchitectureLinkageNode): string {
  return buyerLabelForProvenanceNode(node.type, node.name);
}

/** Secondary type label for tables and detail panels. */
export function provenanceNodeTypeLabel(nodeType: string): string {
  return provenanceGraphNodeTypeBuyerLabel(nodeType);
}

export function provenanceNodeFilterCategory(nodeType: string): ProvenanceNodeFilterCategory | null {
  const t = nodeType.toLowerCase();

  if (t.includes("finding")) {
    return "findings";
  }

  if (t.includes("decision") || t === "reviewer") {
    return "decisions";
  }

  if (
    t.includes("contextsnapshot") ||
    t.includes("graphsnapshot") ||
    t.includes("evidence") ||
    t === "request" ||
    t === "run" ||
    t.includes("policypack")
  ) {
    return "evidence";
  }

  if (t.includes("control") || t.includes("decisionrule") || t.includes("mitigation")) {
    return "controls";
  }

  if (
    t.includes("audit") ||
    t.includes("governance") ||
    t.includes("monitor") ||
    t.includes("riskowner") ||
    t.includes("traceevent")
  ) {
    return "governance";
  }

  if (t.includes("artifact") || t.includes("agenttask") || t.includes("agentresult")) {
    return "artifacts";
  }

  if (t.includes("manifest")) {
    return "governance";
  }

  return null;
}

export function provenanceNodeMatchesFilter(
  node: ArchitectureLinkageNode,
  activeFilters: ReadonlySet<ProvenanceNodeFilterCategory>,
): boolean {
  if (activeFilters.size === 0) {
    return true;
  }

  const category = provenanceNodeFilterCategory(node.type);

  if (category === null) {
    return true;
  }

  return activeFilters.has(category);
}

/** Deterministic layered layout index reflecting provenance sequence. */
export function provenanceNodeLayer(nodeType: string): number {
  const t = nodeType.toLowerCase();

  if (
    t === "request" ||
    t === "run" ||
    t.includes("contextsnapshot") ||
    t.includes("graphsnapshot") ||
    t.includes("evidencebundle") ||
    t.includes("policypack") ||
    t.includes("evidenceartifact") ||
    t.includes("architecturegraph")
  ) {
    return 0;
  }

  if (t.includes("finding")) {
    return 1;
  }

  if (t.includes("control") || t.includes("decisionrule") || t.includes("mitigation")) {
    return 2;
  }

  if (t.includes("decisiontrace") || t.includes("decisionnode") || (t.includes("decision") && !t.includes("decisionrule"))) {
    return 3;
  }

  if (t === "reviewer" || t.includes("monitor") || t.includes("riskowner")) {
    return 3;
  }

  if (
    t.includes("auditevent") ||
    t.includes("governance") ||
    t.includes("traceevent") ||
    t.includes("goldenmanifestpointer")
  ) {
    return 4;
  }

  if (t.includes("manifest")) {
    return 5;
  }

  if (t.includes("artifactbundle") || t.includes("agenttask") || t.includes("agentresult")) {
    return 6;
  }

  return 1;
}

export function provenanceNodeVisualStyle(nodeType: string): ProvenanceNodeVisualStyle {
  const t = nodeType.toLowerCase();
  const layer = provenanceNodeLayer(nodeType);

  if (t.includes("contextsnapshot")) {
    return { layer, fill: "#94a3b8", stroke: "#475569", shape: "circle", legendKey: "contextSnapshot" };
  }

  if (t.includes("graphsnapshot") || t.includes("architecturegraph")) {
    return { layer, fill: "#64748b", stroke: "#334155", shape: "circle", legendKey: "graphSnapshot" };
  }

  if (t.includes("evidencebundle") || t.includes("evidenceartifact")) {
    return { layer, fill: "#78716c", stroke: "#44403c", shape: "square", legendKey: "evidence" };
  }

  if (t.includes("findingssnapshot")) {
    return { layer, fill: "#f97316", stroke: "#c2410c", shape: "square", legendKey: "findingsSnapshot" };
  }

  if (t.includes("finding")) {
    return { layer, fill: "#fb923c", stroke: "#ea580c", shape: "diamond", legendKey: "finding" };
  }

  if (t.includes("control") || t.includes("decisionrule")) {
    return { layer, fill: "#14b8a6", stroke: "#0f766e", shape: "square", legendKey: "control" };
  }

  if (t.includes("decisiontrace") || t.includes("decisionnode")) {
    return { layer, fill: "#3b82f6", stroke: "#1d4ed8", shape: "diamond", legendKey: "decisionTrace" };
  }

  if (t.includes("decision") && !t.includes("decisionrule")) {
    return { layer, fill: "#60a5fa", stroke: "#2563eb", shape: "diamond", legendKey: "decision" };
  }

  if (t.includes("goldenmanifest") || t.includes("manifestversion")) {
    return { layer, fill: "#22c55e", stroke: "#15803d", shape: "square", legendKey: "manifest" };
  }

  if (t.includes("artifactbundle")) {
    return { layer, fill: "#a78bfa", stroke: "#7c3aed", shape: "square", legendKey: "artifactBundle" };
  }

  if (t.includes("audit") || t.includes("governance")) {
    return { layer, fill: "#f59e0b", stroke: "#b45309", shape: "diamond", legendKey: "governance" };
  }

  if (t === "reviewer" || t.includes("riskowner") || t.includes("monitor")) {
    return { layer, fill: "#eab308", stroke: "#a16207", shape: "circle", legendKey: "governanceActor" };
  }

  if (t === "request" || t === "run") {
    return { layer, fill: "#cbd5e1", stroke: "#64748b", shape: "circle", legendKey: "runLifecycle" };
  }

  return { layer, fill: "#cbd5e1", stroke: "#64748b", shape: "circle", legendKey: "other" };
}

export type ProvenanceLegendEntry = {
  key: string;
  label: string;
  fill: string;
  stroke: string;
  shape: ProvenanceNodeVisualStyle["shape"];
};

const LEGEND_LABELS: Record<string, string> = {
  contextSnapshot: "Source context",
  graphSnapshot: "Evidence graph",
  evidence: "Evidence source",
  findingsSnapshot: "Findings snapshot",
  finding: "Finding",
  control: "Control / mitigation",
  decisionTrace: "Decision trace",
  decision: "Decision",
  manifest: SIGNED_MANIFEST_LABEL,
  artifactBundle: "Artifact bundle",
  governance: "Governance record",
  governanceActor: "Governance actor",
  runLifecycle: "Review lifecycle",
  other: "Other",
};

export function provenanceLegendEntriesForNodes(nodes: readonly ArchitectureLinkageNode[]): ProvenanceLegendEntry[] {
  const seen = new Map<string, ProvenanceLegendEntry>();

  for (const node of nodes) {
    const style = provenanceNodeVisualStyle(node.type);

    if (seen.has(style.legendKey)) {
      continue;
    }

    seen.set(style.legendKey, {
      key: style.legendKey,
      label: LEGEND_LABELS[style.legendKey] ?? provenanceNodeTypeLabel(node.type),
      fill: style.fill,
      stroke: style.stroke,
      shape: style.shape,
    });
  }

  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function provenanceEdgeDisplayLabel(
  edge: ArchitectureLinkageEdge,
  nodeById: ReadonlyMap<string, ArchitectureLinkageNode>,
): string {
  const from = nodeById.get(edge.fromNodeId);
  const to = nodeById.get(edge.toNodeId);
  const fromLabel = from !== undefined ? provenanceNodeDisplayName(from) : edge.fromNodeId;
  const toLabel = to !== undefined ? provenanceNodeDisplayName(to) : edge.toNodeId;

  return `${fromLabel} → ${toLabel}`;
}

export function wrapProvenanceLabel(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;

    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word.slice(0, maxCharsPerLine - 1) + "…");
      current = "";
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current.length > 0) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];

    if (!last.endsWith("…")) {
      lines[maxLines - 1] = `${last.replace(/…$/, "")}…`;
    }
  }

  return lines.length > 0 ? lines : [text.slice(0, maxCharsPerLine)];
}
