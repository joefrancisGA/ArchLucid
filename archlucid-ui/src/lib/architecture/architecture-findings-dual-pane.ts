/**
 * TB-2201 — Architecture diagram ↔ findings linked (dual) pane.
 * Distinct from TB-2180 node provenance ("why is this here?").
 * Answers: "where does this finding live in the diagram?" at a glance.
 */

import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";

/** Layout mode when Diagram tab shows findings beside the diagram. */
export const ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID = "architecture-findings-linked" as const;

export const ARCHITECTURE_FINDINGS_DIAGRAM_ONLY_LAYOUT_MODE_ID = "diagram-only" as const;

export type ArchitectureFindingsDualPaneLayoutModeId =
  | typeof ARCHITECTURE_FINDINGS_DIAGRAM_ONLY_LAYOUT_MODE_ID
  | typeof ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID;

export const ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_ON_LABEL = "Show with findings";

export const ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_OFF_LABEL = "Diagram only";

export const ARCHITECTURE_FINDINGS_DUAL_PANE_LINKED_VIEW_TITLE = "Linked view";

export const ARCHITECTURE_FINDINGS_DUAL_PANE_INTRO =
  "Select a finding to highlight where it lives in the architecture diagram. Diagram and findings stay linked in one glance — separate from node provenance.";

export const ARCHITECTURE_FINDINGS_DUAL_PANE_EMPTY_FINDINGS =
  "No assessment findings yet. When findings appear, select one to see its place in the diagram.";

export const ARCHITECTURE_FINDINGS_DUAL_PANE_NO_NODE_MATCH =
  "No matching diagram component for this finding yet. Open the findings tab for the full triage list.";

export const ARCHITECTURE_FINDINGS_DUAL_PANE_MATCHED_NODE_PREFIX = "Linked component";

export type ArchitectureFindingsDualPaneDiagramNode = {
  readonly id: string;
  readonly label: string;
};

/** Minimal finding shape for selection sync (QuickDecisionFinding-compatible). */
export type ArchitectureFindingsDualPaneFindingRef = {
  readonly findingId: string;
  readonly title: string;
  /** Optional persisted ArchitectureFinding JSON for relatedNodeIds extraction. */
  readonly wireJson?: string | null;
  /** Explicit related diagram / evidence-graph node ids when already known. */
  readonly relatedNodeIds?: readonly string[] | null;
};

export type ArchitectureFindingsDiagramMatchKind = "node-id" | "label-heuristic" | "none";

export type ArchitectureFindingsDiagramSelectionSync = {
  readonly findingId: string;
  readonly matchedNodeId: string | null;
  readonly matchedNodeLabel: string | null;
  readonly matchKind: ArchitectureFindingsDiagramMatchKind;
};

function normalizeMatchToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Pull related / examined graph node ids from finding wire JSON when present.
 * Tolerates camelCase and PascalCase field names used across agent payloads.
 */
export function extractRelatedNodeIdsFromFindingWire(wireJson: string | null | undefined): string[] {
  if (wireJson === null || wireJson === undefined) {
    return [];
  }

  const trimmed = wireJson.trim();

  if (trimmed.length === 0) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return [];
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [];
  }

  const record = parsed as Record<string, unknown>;
  const buckets: unknown[] = [
    record.relatedNodeIds,
    record.RelatedNodeIds,
    record.relatedGraphNodeIds,
    record.RelatedGraphNodeIds,
    record.graphNodeIdsExamined,
    record.GraphNodeIdsExamined,
    record.sourceGraphNodeIds,
    record.SourceGraphNodeIds,
  ];

  const collected: string[] = [];

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) {
      continue;
    }

    for (const entry of bucket) {
      if (typeof entry !== "string") {
        continue;
      }

      const id = entry.trim();

      if (id.length > 0 && !collected.includes(id)) {
        collected.push(id);
      }
    }
  }

  const singular = record.nodeId ?? record.NodeId ?? record.graphNodeId ?? record.GraphNodeId;

  if (typeof singular === "string") {
    const id = singular.trim();

    if (id.length > 0 && !collected.includes(id)) {
      collected.push(id);
    }
  }

  return collected;
}

function resolveExplicitNodeIds(finding: ArchitectureFindingsDualPaneFindingRef): string[] {
  const fromProp =
    finding.relatedNodeIds?.map((id) => id.trim()).filter((id) => id.length > 0) ?? [];
  const fromWire = extractRelatedNodeIdsFromFindingWire(finding.wireJson);
  const merged: string[] = [];

  for (const id of [...fromProp, ...fromWire]) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }

  return merged;
}

/**
 * Prefer findingId ↔ nodeId when the finding cites related nodes; otherwise
 * highlight by component name / title substring match (longest label wins).
 */
export function resolveFindingDiagramSelectionSync(
  finding: ArchitectureFindingsDualPaneFindingRef,
  nodes: readonly ArchitectureFindingsDualPaneDiagramNode[],
): ArchitectureFindingsDiagramSelectionSync {
  const findingId = finding.findingId.trim();
  const activeNodes = nodes.filter((node) => node.id.trim().length > 0 && node.label.trim().length > 0);

  if (findingId.length === 0) {
    return {
      findingId: "",
      matchedNodeId: null,
      matchedNodeLabel: null,
      matchKind: "none",
    };
  }

  const explicitIds = resolveExplicitNodeIds(finding);

  for (const candidateId of explicitIds) {
    const byId = activeNodes.find(
      (node) => normalizeMatchToken(node.id) === normalizeMatchToken(candidateId),
    );

    if (byId !== undefined) {
      return {
        findingId,
        matchedNodeId: byId.id,
        matchedNodeLabel: byId.label,
        matchKind: "node-id",
      };
    }
  }

  const titleToken = normalizeMatchToken(finding.title);

  if (titleToken.length === 0 || activeNodes.length === 0) {
    return {
      findingId,
      matchedNodeId: null,
      matchedNodeLabel: null,
      matchKind: "none",
    };
  }

  let best: ArchitectureFindingsDualPaneDiagramNode | null = null;
  let bestScore = 0;

  for (const node of activeNodes) {
    const labelToken = normalizeMatchToken(node.label);

    if (labelToken.length === 0) {
      continue;
    }

    const titleContainsLabel = titleToken.includes(labelToken);
    const labelContainsTitle = labelToken.includes(titleToken) && titleToken.length >= 3;

    if (!titleContainsLabel && !labelContainsTitle) {
      continue;
    }

    const score = labelToken.length;

    if (score > bestScore) {
      best = node;
      bestScore = score;
    }
  }

  if (best === null) {
    return {
      findingId,
      matchedNodeId: null,
      matchedNodeLabel: null,
      matchKind: "none",
    };
  }

  return {
    findingId,
    matchedNodeId: best.id,
    matchedNodeLabel: best.label,
    matchKind: "label-heuristic",
  };
}

export function isArchitectureFindingsLinkedLayout(
  mode: ArchitectureFindingsDualPaneLayoutModeId,
): boolean {
  return mode === ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID;
}

export function resolveArchitectureFindingsDualPaneLayoutMode(
  linked: boolean,
): ArchitectureFindingsDualPaneLayoutModeId {
  if (linked) {
    return ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID;
  }

  return ARCHITECTURE_FINDINGS_DIAGRAM_ONLY_LAYOUT_MODE_ID;
}

export function buildArchitectureFindingsDualPaneDiagramHref(runId: string): string {
  return buildReviewWorkspaceTabHref(runId.trim(), "architecture");
}

export function buildArchitectureFindingsDualPaneFindingsHref(runId: string): string {
  return buildReviewWorkspaceTabHref(runId.trim(), "findings");
}

export function formatLinkedComponentStatus(
  sync: ArchitectureFindingsDiagramSelectionSync,
): string {
  if (sync.matchKind === "none" || sync.matchedNodeLabel === null) {
    return ARCHITECTURE_FINDINGS_DUAL_PANE_NO_NODE_MATCH;
  }

  return `${ARCHITECTURE_FINDINGS_DUAL_PANE_MATCHED_NODE_PREFIX}: ${sync.matchedNodeLabel}`;
}