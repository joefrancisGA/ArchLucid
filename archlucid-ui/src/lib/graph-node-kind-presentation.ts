/**
 * Categorical (non-status) palette for evidence-graph node kinds.
 * Legend chips and React Flow nodes share these tokens — do not reuse status hues (ready/warn/blocked).
 * @see docs/library/UI_DESIGN_SYSTEM.md § Design tokens
 */

export type GraphNodeKindKey = "decision" | "finding" | "artifact" | "review" | "component" | "default";

export type GraphNodeKindLegendEntry = {
  readonly key: GraphNodeKindKey;
  readonly label: string;
};

/** Canonical legend rows — matches {@link resolveGraphNodeKindKey} taxonomy. */
export const GRAPH_NODE_KIND_LEGEND_ENTRIES: ReadonlyArray<GraphNodeKindLegendEntry> = [
  { key: "decision", label: "Decision" },
  { key: "finding", label: "Finding" },
  { key: "artifact", label: "Artifact" },
  { key: "review", label: "Review" },
  { key: "component", label: "Component" },
] as const;

const GRAPH_NODE_KIND_CSS_PREFIX = "--al-graph-kind";

export function graphNodeKindCssVar(key: GraphNodeKindKey, slot: "bg" | "border" | "swatch"): string {
  return `var(${GRAPH_NODE_KIND_CSS_PREFIX}-${key}-${slot})`;
}

export function graphNodeKindPresentation(key: GraphNodeKindKey): {
  readonly background: string;
  readonly border: string;
  readonly swatch: string;
} {
  return {
    background: graphNodeKindCssVar(key, "bg"),
    border: graphNodeKindCssVar(key, "border"),
    swatch: graphNodeKindCssVar(key, "swatch"),
  };
}

/**
 * Maps API graph node `type` strings to the five buyer-visible categories (+ default fallback).
 */
export function resolveGraphNodeKindKey(nodeType: string): GraphNodeKindKey {
  const normalized = nodeType.trim();

  switch (normalized) {
    case "Decision":
      return "decision";

    case "Finding":
      return "finding";

    case "Artifact":
    case "ArtifactBundle":
    case "Rule":
      return "artifact";

    case "GoldenManifest":
    case "ArchitectureRun":
    case "Manifest":
      return "review";

    case "Component":
    case "TopologyResource":
    case "GraphNode":
    case "SecurityBaseline":
    case "PolicyControl":
    case "Requirement":
    case "ContextSnapshot":
    case "GraphSnapshot":
    case "FindingsSnapshot":
    case "PolicyPack":
      return "component";

    default:
      return "default";
  }
}

/** Buyer-trail type caption — omitted when evidence-source subtitles already name the role. */
export function resolveGraphNodeKindBuyerLabel(nodeType: string): string | null {
  const key = resolveGraphNodeKindKey(nodeType);

  if (key === "default") {
    return null;
  }

  const entry = GRAPH_NODE_KIND_LEGEND_ENTRIES.find((row) => row.key === key);

  return entry?.label ?? null;
}
