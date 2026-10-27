"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { InfraEvidenceDeclaredConnectionDetailPanel } from "@/components/infra-evidence/InfraEvidenceDeclaredConnectionDetailPanel";
import { InfraEvidenceInventoryEdgeDetailPanel } from "@/components/infra-evidence/InfraEvidenceInventoryEdgeDetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_NODES_SEED_HINT,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_CONNECTED_SECTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_EDGES_DISCLOSURE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_LEDGER_DISCLOSURE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NODES_DISCLOSURE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_ORPHANED_SECTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNCONNECTED_SECTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_EMPTY_DETAIL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SCOPE_ALL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SCOPE_DIAGRAM_NEIGHBOR,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SCOPE_STARTING_RG,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SEARCH_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SUMMARY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION_COUNT_FILTERED,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_USED_SECTION,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  filterDiagramOutlineUnknownNodes,
  resolveDefaultDiagramOutlineUnknownNodeFilterScope,
  type DiagramOutlineUnknownNodeFilterScope,
} from "@/lib/infra-evidence/diagram-outline-unknown-node-filter";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import { resolveInfraEvidenceOutlineEdgeToDisplay } from "@/lib/infra-evidence/format-infra-evidence-outline-edge-to-label";
import {
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_COLUMN,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_NOT_STORED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_PROBABLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import { InfraEvidenceDiagramOutlineNodeLabel } from "@/lib/infra-evidence/infra-evidence-diagram-outline-node-label";
import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";
import { downloadBrowserTextFile, safeGraphExportFilenameSegment } from "@/lib/graph-view-model-export";
import {
  DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_DIR,
  DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_KEY,
  DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR,
  DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY,
  sortDirectionForInfraEvidenceDiagramOutlineEdgeColumn,
  sortDirectionForInfraEvidenceDiagramOutlineNodeColumn,
  sortInfraEvidenceDiagramOutlineEdges,
  sortInfraEvidenceDiagramOutlineNodes,
  toggleInfraEvidenceDiagramOutlineEdgeSort,
  toggleInfraEvidenceDiagramOutlineNodeSort,
  type InfraEvidenceDiagramOutlineEdgeSortKey,
  type InfraEvidenceDiagramOutlineNodeSortKey,
} from "@/lib/infra-evidence/infra-evidence-diagram-outline-sort";
import { formatInfraEvidenceDiagramDropGateReasonLabel } from "@/lib/infra-evidence/format-infra-evidence-diagram-drop-gate-reason";
import {
  formatInfraEvidenceOutlineProvenanceReviewerBand,
  resolveInfraEvidenceOutlineNodeLabel,
  resolveInfraEvidenceOutlineEdgeLabel,
  type InfraEvidenceDiagramOutlineEdgeSource,
  type InfraEvidenceMermaidOutline,
  type InfraEvidenceMermaidOutlineEdge,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { listSecurityDeclaredConnections } from "@/lib/security-declared-connection-api";
import type { SecurityDeclaredConnectionRow } from "@/lib/security-declared-connection-types";

const OUTLINE_NODES_OPEN_STORAGE_KEY = "infra-diagrams-outline-nodes-open";
const OUTLINE_EDGES_OPEN_STORAGE_KEY = "infra-diagrams-outline-edges-open";

type ConnectionStateKey = "Connected" | "Used" | "Orphaned" | "Unconnected" | "Unknown" | "NotStored";

function resolveOutlineConnectionStateSectionLabel(state: ConnectionStateKey): string {
  switch (state) {
    case "Connected":
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_CONNECTED_SECTION;

    case "Used":
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_USED_SECTION;

    case "Orphaned":
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_ORPHANED_SECTION;

    case "Unconnected":
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNCONNECTED_SECTION;

    case "NotStored":
      return "Connection state was not stored.";

    default:
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION;
  }
}

function resolveNodeProblem(node: InfraEvidenceMermaidOutlineNode): string {
  if (node.connectionState == null) {
    return "No connection state detail was stored.";
  }

  if (node.connectionState === "Unknown") {
    const unknownDetails = node.unresolvedRelationshipDetails;

    if (unknownDetails === null || unknownDetails === undefined) {
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION;
    }

    if (unknownDetails.length > 0) {
      return unknownDetails.join(" ");
    }

    return "Unresolved relationship details were stored empty.";
  }

  const details = node.unresolvedRelationshipDetails ?? [];

  if (details.length > 0) {
    return details.join(" ");
  }

  const questionableReason = node.questionableReason?.trim() ?? "";
  const questionableAction = node.questionableAction?.trim() ?? "";

  if (questionableReason.length > 0) {
    return questionableAction.length > 0
      ? `${questionableReason} Recommended action: ${questionableAction}`
      : `${questionableReason} Recommended action was not stored.`;
  }

  if (questionableAction.length > 0) {
    return `${questionableAction} Question reason was not stored.`;
  }

  const separatorIndex = node.label.indexOf(" · ");

  if (separatorIndex >= 0) {
    const problem = node.label.slice(separatorIndex + 3).trim();

    if (problem.length > 0) {
      return problem;
    }
  }

  if (node.connectionState === "Orphaned") {
    return "Missing a required link. The missing-link reason was not stored.";
  }

  return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_EMPTY_DETAIL;
}

function formatLedgerDropLabel(
  drop: { readonly reason: string; readonly from: string; readonly to: string | null },
  nodes: readonly InfraEvidenceMermaidOutlineNode[],
): string {
  const fromLabel = resolveInfraEvidenceOutlineNodeLabel(nodes, drop.from);
  const reasonLabel = formatInfraEvidenceDiagramDropGateReasonLabel(drop.reason);

  if (
    drop.reason === "nsg-unattached"
    || drop.reason === "nsg-unattached-no-association"
    || drop.reason === "nsg-unattached-off-diagram"
  ) {
    return `${reasonLabel} · ${fromLabel}`;
  }

  const toLabel = drop.to == null || drop.to === "_" ? "Destination was not stored" : resolveInfraEvidenceOutlineNodeLabel(nodes, drop.to);

  return `${reasonLabel} · ${fromLabel} → ${toLabel}`;
}

type InfraEvidenceDiagramOutlineProps = {
  readonly outline: InfraEvidenceMermaidOutline;
  readonly onFocusNeighborhood?: (node: InfraEvidenceMermaidOutlineNode) => void;
  readonly selectedInventoryEdge?: InfraEvidenceMermaidOutlineEdge | null;
  readonly onSelectInventoryEdge?: (edge: InfraEvidenceMermaidOutlineEdge | null) => void;
  readonly defaultNodesOpen?: boolean;
  readonly defaultEdgesOpen?: boolean;
  /** Inventory graph seed for the starting resource (dependency neighborhood focus). */
  readonly startingResourceSeedId?: string | null;
  /** Initial scope for the unknown-node filter (resets when the seed changes). */
  readonly unknownFilterDefaultScope?: DiagramOutlineUnknownNodeFilterScope;
};

function formatUnknownFilterSummary(shown: number, total: number): string {
  return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SUMMARY
    .replace("{shown}", String(shown))
    .replace("{total}", String(total));
}

function formatUnknownSectionCount(shown: number, total: number): string {
  if (shown === total) {
    return String(total);
  }

  return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION_COUNT_FILTERED
    .replace("{shown}", String(shown))
    .replace("{total}", String(total));
}

function formatOutlineCell(value: string | null, missingLabel = "Not recorded"): string {
  if (value === null) {
    return missingLabel;
  }

  if (value.trim().length === 0) {
    return missingLabel;
  }

  return value;
}

function formatOutlineResourceType(resourceType: string | null | undefined): string {
  if (resourceType === null || resourceType === undefined) {
    return "Resource type was not stored";
  }

  if (resourceType.trim().length === 0) {
    return "Resource type was not stored";
  }

  return formatDiagramArmTypeFriendlyName(resourceType) ?? "Resource type was not stored";
}

function formatOutlineEdgeSource(
  source: InfraEvidenceDiagramOutlineEdgeSource,
  provenanceKind: string | null = null,
): string {
  if (provenanceKind !== null && provenanceKind.trim().length > 0) {
    const normalized = provenanceKind.trim().toLowerCase();

    if (normalized !== "observedfact" && source === "observed") {
      return formatInfraEvidenceOutlineProvenanceReviewerBand(provenanceKind);
    }

    if (source === "missing") {
      return formatInfraEvidenceOutlineProvenanceReviewerBand(provenanceKind);
    }
  }

  switch (source) {
    case "missing":
      return INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_NOT_STORED;

    case "declared":
      return INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_DECLARED;

    case "inferred":
      return INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_INFERRED;

    case "probable":
      return INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_PROBABLE;

    default:
      return INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_OBSERVED;
  }
}

function readOutlineSectionOpenFromSessionStorage(storageKey: string): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(storageKey);

    if (stored === null) {
      return null;
    }

    return stored === "true";
  } catch {
    return null;
  }
}

function writeOutlineSectionOpenToSessionStorage(storageKey: string, open: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, String(open));
  } catch {
    // Session storage may be unavailable in private mode.
  }
}

function downloadDiagramOutlineJson(
  kind: "nodes" | "edges",
  rows: readonly unknown[],
): void {
  const payload = {
    exportKind: `ArchLucid.InfraEvidenceDiagram.${kind}.v1`,
    note: "These rows are the diagram outline. Edges may be observed, declared, probable, or inferred. A property that is absent was not stored.",
    [kind]: rows,
  };

  downloadBrowserTextFile(
    `infra-diagram-${kind}-${safeGraphExportFilenameSegment(new Date().toISOString())}.json`,
    `${JSON.stringify(payload, null, 2)}\n`,
    "application/json;charset=utf-8",
  );
}

function InfraEvidenceDiagramOutlineSortableHeader<TColumn extends string>(props: {
  readonly column: TColumn;
  readonly label: string;
  readonly sortKey: TColumn;
  readonly sortDir: "asc" | "desc";
  readonly onSort: (column: TColumn) => void;
  readonly resolveAriaSort: (
    sortKey: TColumn,
    column: TColumn,
    sortDir: "asc" | "desc",
  ) => "ascending" | "descending" | "none";
}): React.JSX.Element {
  const isActive = props.sortKey === props.column;
  const directionLabel = props.sortDir === "asc" ? "ascending" : "descending";

  return (
    <th
      className="px-3 py-2 font-medium"
      scope="col"
      aria-sort={props.resolveAriaSort(props.sortKey, props.column, props.sortDir)}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-left font-inherit font-medium hover:text-al-text-primary",
          isActive ? "text-al-text-primary" : "text-al-text-secondary",
        )}
        aria-label={isActive ? `Sort by ${props.label}, ${directionLabel}` : `Sort by ${props.label}`}
        onClick={() => {
          props.onSort(props.column);
        }}
      >
        {props.label}
        {isActive ? (props.sortDir === "asc" ? " ↑" : " ↓") : null}
      </button>
    </th>
  );
}

function InfraEvidenceDiagramOutlineNodeTable(props: {
  readonly nodes: readonly InfraEvidenceMermaidOutlineNode[];
  readonly sectionLabel: string;
  readonly sectionCountLabel?: string;
  readonly sectionTestId: string;
  readonly showProblem?: boolean;
  readonly nodeSortKey: InfraEvidenceDiagramOutlineNodeSortKey;
  readonly nodeSortDir: "asc" | "desc";
  readonly onSort: (column: InfraEvidenceDiagramOutlineNodeSortKey) => void;
  readonly showNeighborhoodActions: boolean;
  readonly onFocusNeighborhood?: (node: InfraEvidenceMermaidOutlineNode) => void;
}): React.JSX.Element {
  const {
    nodes,
    sectionLabel,
    sectionCountLabel,
    sectionTestId,
    showProblem = false,
    nodeSortKey,
    nodeSortDir,
    onSort,
    showNeighborhoodActions,
    onFocusNeighborhood,
  } = props;

  const countLabel = sectionCountLabel ?? String(nodes.length);

  return (
    <section
      className="flex flex-col gap-2 border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-800"
      data-testid={sectionTestId}
      aria-label={`${sectionLabel} (${countLabel})`}
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {sectionLabel} ({countLabel})
      </h3>
      {nodes.length > 0 ? (
        <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
          <thead className="bg-neutral-50 dark:bg-neutral-900/60">
            <tr>
              <InfraEvidenceDiagramOutlineSortableHeader
                column="label"
                label="Node Name"
                sortKey={nodeSortKey}
                sortDir={nodeSortDir}
                onSort={onSort}
                resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineNodeColumn}
              />
              <InfraEvidenceDiagramOutlineSortableHeader
                column="resourceType"
                label="Resource type"
                sortKey={nodeSortKey}
                sortDir={nodeSortDir}
                onSort={onSort}
                resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineNodeColumn}
              />
              <InfraEvidenceDiagramOutlineSortableHeader
                column="resourceGroup"
                label="Resource group"
                sortKey={nodeSortKey}
                sortDir={nodeSortDir}
                onSort={onSort}
                resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineNodeColumn}
              />
              {showProblem ? (
                <th className="px-3 py-2 font-medium" scope="col">
                  Problem
                </th>
              ) : null}
              {showNeighborhoodActions ? (
                <th className="px-3 py-2 font-medium" scope="col">
                  Neighborhood
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-2">
                  <InfraEvidenceDiagramOutlineNodeLabel node={node} />
                </td>
                <td className="px-3 py-2">{formatOutlineResourceType(node.resourceType)}</td>
                <td className={cn("px-3 py-2 font-mono", OPERATOR_TYPOGRAPHY.body)}>
                  {formatOutlineCell(node.resourceGroup, "Resource group was not stored.")}
                </td>
                {showProblem ? (
                  <td className={cn("px-3 py-2", OPERATOR_TYPOGRAPHY.body)}>
                    {resolveNodeProblem(node)}
                  </td>
                ) : null}
                {showNeighborhoodActions ? (
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid={`infra-diagrams-focus-neighborhood-${node.id}`}
                      aria-label={`${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION} from ${resolveInfraEvidenceDiagramOutlineResourceName(node)}`}
                      onClick={() => {
                        onFocusNeighborhood?.(node);
                      }}
                    >
                      {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION}
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No {sectionLabel.toLowerCase()}.
        </p>
      )}
    </section>
  );
}

/** Structured list alternative to the Mermaid canvas (WCAG 1.1.1 peer affordance). */
export function InfraEvidenceDiagramOutline(props: InfraEvidenceDiagramOutlineProps): React.JSX.Element {
  const {
    outline,
    onFocusNeighborhood,
    selectedInventoryEdge: selectedInventoryEdgeProp,
    onSelectInventoryEdge,
    defaultNodesOpen = false,
    defaultEdgesOpen = false,
    startingResourceSeedId = null,
    unknownFilterDefaultScope,
  } = props;
  const [nodeSortKey, setNodeSortKey] = useState(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY);
  const [nodeSortDir, setNodeSortDir] = useState<"asc" | "desc">(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR);
  const [edgeSortKey, setEdgeSortKey] = useState(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_KEY);
  const [edgeSortDir, setEdgeSortDir] = useState<"asc" | "desc">(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_DIR);
  const [nodesOpen, setNodesOpen] = useState(defaultNodesOpen);
  const [edgesOpen, setEdgesOpen] = useState(defaultEdgesOpen);
  const [selectedDeclaredEdge, setSelectedDeclaredEdge] = useState<InfraEvidenceMermaidOutlineEdge | null>(null);
  const [localSelectedInventoryEdge, setLocalSelectedInventoryEdge] = useState<InfraEvidenceMermaidOutlineEdge | null>(null);
  const inventoryEdgePanelRef = useRef<HTMLDivElement>(null);
  const [declaredConnections, setDeclaredConnections] = useState<SecurityDeclaredConnectionRow[]>([]);
  const [declaredConnectionsLoading, setDeclaredConnectionsLoading] = useState(false);
  const [declaredConnectionsError, setDeclaredConnectionsError] = useState<string | null>(null);
  const [unknownFilterScope, setUnknownFilterScope] = useState<DiagramOutlineUnknownNodeFilterScope>(() =>
    unknownFilterDefaultScope ?? resolveDefaultDiagramOutlineUnknownNodeFilterScope(startingResourceSeedId));
  const [unknownSearchQuery, setUnknownSearchQuery] = useState("");
  const selectedInventoryEdge = selectedInventoryEdgeProp === undefined
    ? localSelectedInventoryEdge
    : selectedInventoryEdgeProp;

  const selectInventoryEdge = (edge: InfraEvidenceMermaidOutlineEdge | null): void => {
    setLocalSelectedInventoryEdge(edge);
    onSelectInventoryEdge?.(edge);
  };

  useEffect(() => {
    setSelectedDeclaredEdge(null);
    setLocalSelectedInventoryEdge(null);
    setDeclaredConnections([]);
    setDeclaredConnectionsError(null);
  }, [outline]);

  useEffect(() => {
    setUnknownFilterScope(
      unknownFilterDefaultScope ?? resolveDefaultDiagramOutlineUnknownNodeFilterScope(startingResourceSeedId),
    );
    setUnknownSearchQuery("");
  }, [startingResourceSeedId, unknownFilterDefaultScope]);

  useEffect(() => {
    if (selectedInventoryEdgeProp == null) {
      return;
    }

    setSelectedDeclaredEdge(null);
    setEdgesOpen(true);
    window.requestAnimationFrame(() => {
      const panel = inventoryEdgePanelRef.current;

      if (panel === null) {
        return;
      }

      panel.scrollIntoView?.({ block: "nearest" });
      panel.focus();
    });
  }, [selectedInventoryEdgeProp]);

  useEffect(() => {
    const storedNodesOpen = readOutlineSectionOpenFromSessionStorage(OUTLINE_NODES_OPEN_STORAGE_KEY);

    if (storedNodesOpen !== null) {
      setNodesOpen(storedNodesOpen);
    } else {
      setNodesOpen(defaultNodesOpen);
    }

    const storedEdgesOpen = readOutlineSectionOpenFromSessionStorage(OUTLINE_EDGES_OPEN_STORAGE_KEY);

    if (storedEdgesOpen !== null) {
      setEdgesOpen(storedEdgesOpen);
    } else {
      setEdgesOpen(defaultEdgesOpen);
    }
  }, [defaultEdgesOpen, defaultNodesOpen]);

  useEffect(() => {
    if (selectedDeclaredEdge == null) {
      return;
    }

    let cancelled = false;
    setDeclaredConnectionsLoading(true);
    setDeclaredConnectionsError(null);

    void listSecurityDeclaredConnections()
      .then((rows) => {
        if (!cancelled) {
          setDeclaredConnections(rows);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDeclaredConnections([]);
          setDeclaredConnectionsError(error instanceof Error ? error.message : "Failed to load declared connections.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDeclaredConnectionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeclaredEdge]);

  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();

    for (const edge of outline.edges) {
      ids.add(edge.from);
      ids.add(edge.to);
    }

    return ids;
  }, [outline.edges]);
  const allConnectedNodes = useMemo(
    () => outline.nodes.filter((node) => connectedNodeIds.has(node.id)),
    [connectedNodeIds, outline.nodes],
  );
  const allUnconnectedNodes = useMemo(
    () => outline.nodes.filter((node) => !connectedNodeIds.has(node.id)),
    [connectedNodeIds, outline.nodes],
  );
  const stateRows = useMemo(() => {
    const stateByNodeId = new Map<string, ConnectionStateKey>();

    for (const node of outline.nodes) {
      stateByNodeId.set(node.id, node.connectionState ?? "NotStored");
    }

    for (const node of allUnconnectedNodes) {
      if (stateByNodeId.get(node.id) == null) {
        stateByNodeId.set(node.id, "NotStored");
      }
    }

    for (const node of allConnectedNodes) {
      if (node.connectionState === null) {
        stateByNodeId.set(node.id, "NotStored");
      } else if (node.connectionState === undefined) {
        stateByNodeId.set(node.id, "NotStored");
      }
    }

    const rows = new Map<string, readonly InfraEvidenceMermaidOutlineNode[]>();
    for (const state of ["Connected", "Used", "Orphaned", "Unconnected", "Unknown", "NotStored"] as const) {
      rows.set(
        state,
        sortInfraEvidenceDiagramOutlineNodes(
          outline.nodes.filter((node) => stateByNodeId.get(node.id) === state),
          nodeSortKey,
          nodeSortDir,
        ),
      );
    }

    return rows;
  }, [allConnectedNodes, allUnconnectedNodes, nodeSortDir, nodeSortKey, outline.nodes]);
  const edgeRows = useMemo(
    () => sortInfraEvidenceDiagramOutlineEdges(outline.edges, outline.nodes, edgeSortKey, edgeSortDir),
    [edgeSortDir, edgeSortKey, outline.edges, outline.nodes],
  );
  const edgeRowsBySource = useMemo(() => {
    const sourceOrder: readonly InfraEvidenceDiagramOutlineEdgeSource[] = [
      "probable",
      "missing",
      "observed",
      "declared",
      "inferred",
    ];

    return sourceOrder
      .map((source) => ({
        source,
        rows: edgeRows.filter((edge) => edge.source === source),
      }))
      .filter((group) => group.rows.length > 0);
  }, [edgeRows]);
  const unknownNodes = stateRows.get("Unknown") ?? [];
  const filteredUnknownNodes = useMemo(
    () => sortInfraEvidenceDiagramOutlineNodes(
      filterDiagramOutlineUnknownNodes({
        nodes: unknownNodes,
        outline,
        startingSeedId: startingResourceSeedId,
        scope: unknownFilterScope,
        searchQuery: unknownSearchQuery,
      }),
      nodeSortKey,
      nodeSortDir,
    ),
    [
      nodeSortDir,
      nodeSortKey,
      outline,
      startingResourceSeedId,
      unknownFilterScope,
      unknownNodes,
      unknownSearchQuery,
    ],
  );
  const unknownFilterActive = filteredUnknownNodes.length !== unknownNodes.length;
  const startingSeedTrimmed = startingResourceSeedId?.trim() ?? "";
  const showEdgesSection = outline.edges.length > 0;
  const ledgerDropsKnown = Array.isArray(outline.ledgerDrops);
  const ledgerDropsStoredEmpty = ledgerDropsKnown && outline.ledgerDrops.length === 0;
  const showLedgerSection = ledgerDropsKnown && outline.ledgerDrops.length > 0;
  const ledgerDropsNotReturned = !ledgerDropsKnown;

  const showNeighborhoodActions = onFocusNeighborhood != null;
  const connectionStateSectionOrder = useMemo((): readonly ConnectionStateKey[] => {
    const base: readonly ConnectionStateKey[] = [
      "Connected",
      "Used",
      "Orphaned",
      "Unconnected",
      "Unknown",
      "NotStored",
    ];

    if (startingSeedTrimmed.length > 0 && unknownNodes.length > 0) {
      return ["Unknown", ...base.filter((state) => state !== "Unknown")];
    }

    return base;
  }, [startingSeedTrimmed, unknownNodes.length]);

  const handleNodeSort = (column: InfraEvidenceDiagramOutlineNodeSortKey) => {
    const next = toggleInfraEvidenceDiagramOutlineNodeSort(nodeSortKey, nodeSortDir, column);

    setNodeSortKey(next.sortKey);
    setNodeSortDir(next.sortDir);
  };

  const handleEdgeSort = (column: InfraEvidenceDiagramOutlineEdgeSortKey) => {
    const next = toggleInfraEvidenceDiagramOutlineEdgeSort(edgeSortKey, edgeSortDir, column);

    setEdgeSortKey(next.sortKey);
    setEdgeSortDir(next.sortDir);
  };

  const toggleNodesOpen = () => {
    setNodesOpen((current) => {
      const next = !current;
      writeOutlineSectionOpenToSessionStorage(OUTLINE_NODES_OPEN_STORAGE_KEY, next);

      return next;
    });
  };

  const toggleEdgesOpen = () => {
    setEdgesOpen((current) => {
      const next = !current;
      writeOutlineSectionOpenToSessionStorage(OUTLINE_EDGES_OPEN_STORAGE_KEY, next);

      return next;
    });
  };

  return (
    <div
      data-testid="infra-diagrams-mermaid-outline"
      className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-700"
    >
      <div className="flex flex-col gap-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Download the nodes and edges for this diagram. The file includes observed, declared, probable, and inferred rows. An absent property was not stored.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="infra-diagrams-download-nodes-json"
              onClick={() => downloadDiagramOutlineJson("nodes", outline.nodes)}
            >
              Download nodes JSON
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="infra-diagrams-download-edges-json"
              onClick={() => downloadDiagramOutlineJson("edges", outline.edges)}
            >
              Download edges JSON
            </Button>
          </div>
        </div>
        <div>
          <button
            type="button"
            className={cn(
              "m-0 mb-2 flex w-full items-center justify-between gap-2 border-0 bg-transparent p-0 text-left",
              OPERATOR_DISCLOSURE_TRIGGER_CLASS,
            )}
            data-testid="infra-diagrams-outline-nodes-disclosure"
            aria-expanded={nodesOpen}
            aria-controls="infra-diagrams-outline-nodes-panel"
            onClick={toggleNodesOpen}
          >
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NODES_DISCLOSURE_LABEL} ({outline.nodes.length})
          </button>
          {nodesOpen ? (
            <div id="infra-diagrams-outline-nodes-panel" data-testid="infra-diagrams-outline-nodes-panel">
              {showNeighborhoodActions ? (
                <p
                  className={cn("m-0 mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="infra-diagrams-nodes-seed-hint"
                >
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_NODES_SEED_HINT}
                </p>
              ) : null}
              <div className="flex flex-col gap-4">
                {unknownNodes.length > 0 ? (
                  <>
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="infra-diagrams-unknown-questions"
                    >
                      {unknownNodes.length === 1
                        ? "ArchLucid has a question about 1 resource."
                        : `ArchLucid has questions about ${unknownNodes.length} resources.`}
                    </p>
                    <div
                      className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                      data-testid="infra-diagrams-unknown-filter"
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex min-w-[14rem] flex-col gap-1">
                          <Label htmlFor="infra-diagrams-unknown-filter-scope">
                            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_LABEL}
                          </Label>
                          <select
                            id="infra-diagrams-unknown-filter-scope"
                            className={cn(
                              "h-9 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-700 dark:bg-neutral-950",
                              OPERATOR_TYPOGRAPHY.body,
                            )}
                            value={unknownFilterScope}
                            onChange={(event) => {
                              setUnknownFilterScope(event.target.value as DiagramOutlineUnknownNodeFilterScope);
                            }}
                          >
                            <option value="all">
                              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SCOPE_ALL}
                            </option>
                            <option value="startingResourceGroup" disabled={startingSeedTrimmed.length === 0}>
                              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SCOPE_STARTING_RG}
                            </option>
                            <option value="diagramNeighbor" disabled={startingSeedTrimmed.length === 0}>
                              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SCOPE_DIAGRAM_NEIGHBOR}
                            </option>
                          </select>
                        </div>
                        <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
                          <Label htmlFor="infra-diagrams-unknown-filter-search">
                            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_FILTER_SEARCH_LABEL}
                          </Label>
                          <Input
                            id="infra-diagrams-unknown-filter-search"
                            type="search"
                            value={unknownSearchQuery}
                            placeholder="Name, type, or resource group"
                            onChange={(event) => {
                              setUnknownSearchQuery(event.target.value);
                            }}
                          />
                        </div>
                      </div>
                      {unknownFilterActive ? (
                        <p
                          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                          data-testid="infra-diagrams-unknown-filter-summary"
                        >
                          {formatUnknownFilterSummary(filteredUnknownNodes.length, unknownNodes.length)}
                        </p>
                      ) : null}
                      {filteredUnknownNodes.length === 0 ? (
                        <p
                          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                          data-testid="infra-diagrams-unknown-filter-empty"
                        >
                          No unknown rows match this filter. Choose a broader scope or clear the search.
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {connectionStateSectionOrder.map((state) => {
                  let nodes = stateRows.get(state) ?? [];

                  if (state === "Unknown") {
                    nodes = filteredUnknownNodes;
                  }

                  if (nodes.length === 0) {
                    return null;
                  }

                  const sectionCountLabel = state === "Unknown" && unknownFilterActive
                    ? formatUnknownSectionCount(filteredUnknownNodes.length, unknownNodes.length)
                    : undefined;

                  return (
                  <InfraEvidenceDiagramOutlineNodeTable
                    key={state}
                    nodes={nodes}
                    sectionLabel={resolveOutlineConnectionStateSectionLabel(state)}
                    sectionCountLabel={sectionCountLabel}
                    sectionTestId={`infra-diagrams-${state.toLowerCase()}-nodes-list`}
                    showProblem={state === "Orphaned" || state === "Unknown" || state === "NotStored"}
                    nodeSortKey={nodeSortKey}
                    nodeSortDir={nodeSortDir}
                    onSort={handleNodeSort}
                    showNeighborhoodActions={showNeighborhoodActions}
                    onFocusNeighborhood={onFocusNeighborhood}
                  />
                  );
                })}
                {ledgerDropsStoredEmpty ? (
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="infra-diagrams-ledger-drops-stored-empty"
                  >
                    Dropped relationships were stored empty.
                  </p>
                ) : null}
                {ledgerDropsNotReturned ? (
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="infra-diagrams-ledger-drops-not-returned"
                  >
                    This diagram response did not include dropped-relationship rows.
                  </p>
                ) : null}
                {showLedgerSection ? (
                  <section
                    className="flex flex-col gap-2"
                    data-testid="infra-diagrams-ledger-drops-list"
                    aria-label={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_LEDGER_DISCLOSURE_LABEL}
                  >
                    <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_LEDGER_DISCLOSURE_LABEL}
                    </h3>
                    <ul className={cn("m-0 list-disc pl-5", OPERATOR_TYPOGRAPHY.body)}>
                      {(outline.ledgerDrops ?? []).map((drop) => (
                        <li key={`${drop.reason}-${drop.from}-${drop.to ?? "_"}`}>
                          {formatLedgerDropLabel(drop, outline.nodes)}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
              {outline.nodes.length === 0 ? (
                <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  No nodes parsed from the Mermaid source.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {showEdgesSection ? (
          <div>
            <button
              type="button"
            className={cn(
              "m-0 mb-2 flex w-full items-center justify-between gap-2 border-0 bg-transparent p-0 text-left",
              OPERATOR_DISCLOSURE_TRIGGER_CLASS,
            )}
            data-testid="infra-diagrams-outline-edges-disclosure"
              aria-expanded={edgesOpen}
              aria-controls="infra-diagrams-outline-edges-panel"
              onClick={toggleEdgesOpen}
            >
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_EDGES_DISCLOSURE_LABEL} ({outline.edges.length})
            </button>
            {edgesOpen ? (
              <div id="infra-diagrams-outline-edges-panel" data-testid="infra-diagrams-outline-edges-panel">
                {selectedDeclaredEdge != null ? (
                  <div className="mb-4">
                    <InfraEvidenceDeclaredConnectionDetailPanel
                      edge={selectedDeclaredEdge}
                      nodes={outline.nodes}
                      connections={declaredConnections}
                      connectionsLoading={declaredConnectionsLoading}
                      connectionsError={declaredConnectionsError}
                      onClose={() => {
                        setSelectedDeclaredEdge(null);
                      }}
                    />
                  </div>
                ) : null}
                {selectedInventoryEdge != null ? (
                  <div
                    ref={inventoryEdgePanelRef}
                    className="mb-4"
                    data-testid="infra-evidence-inventory-edge-detail-panel-container"
                    tabIndex={-1}
                  >
                    <InfraEvidenceInventoryEdgeDetailPanel
                      edge={selectedInventoryEdge}
                      onClose={() => {
                        selectInventoryEdge(null);
                      }}
                    />
                  </div>
                ) : null}
                <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
                  <thead className="bg-neutral-50 dark:bg-neutral-900/60">
                    <tr>
                      <InfraEvidenceDiagramOutlineSortableHeader
                        column="source"
                        label={INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_COLUMN}
                        sortKey={edgeSortKey}
                        sortDir={edgeSortDir}
                        onSort={handleEdgeSort}
                        resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineEdgeColumn}
                      />
                      <InfraEvidenceDiagramOutlineSortableHeader
                        column="from"
                        label="From"
                        sortKey={edgeSortKey}
                        sortDir={edgeSortDir}
                        onSort={handleEdgeSort}
                        resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineEdgeColumn}
                      />
                      <InfraEvidenceDiagramOutlineSortableHeader
                        column="relationship"
                        label="Relationship"
                        sortKey={edgeSortKey}
                        sortDir={edgeSortDir}
                        onSort={handleEdgeSort}
                        resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineEdgeColumn}
                      />
                      <InfraEvidenceDiagramOutlineSortableHeader
                        column="to"
                        label="To"
                        sortKey={edgeSortKey}
                        sortDir={edgeSortDir}
                        onSort={handleEdgeSort}
                        resolveAriaSort={sortDirectionForInfraEvidenceDiagramOutlineEdgeColumn}
                      />
                    </tr>
                  </thead>
                  {edgeRowsBySource.map((group) => (
                    <tbody key={group.source} data-testid={`infra-diagrams-edge-source-${group.source}`}>
                      <tr className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <th className="px-3 py-2 text-left font-medium" colSpan={4} scope="rowgroup">
                          {formatOutlineEdgeSource(group.source, group.rows[0]?.provenanceKind ?? null)} edges ({group.rows.length})
                        </th>
                      </tr>
                      {group.rows.map((edge, index) => {
                      const fromNode = outline.nodes.find((node) => node.id === edge.from);
                      const toNode = outline.nodes.find((node) => node.id === edge.to);
                      const toDisplay = resolveInfraEvidenceOutlineEdgeToDisplay({
                        fromNode,
                        toNode,
                        fromFallback: resolveInfraEvidenceOutlineNodeLabel(outline.nodes, edge.from),
                        toFallback: resolveInfraEvidenceOutlineNodeLabel(outline.nodes, edge.to),
                      });
                      const fromAccessibleName =
                        fromNode != null
                          ? resolveInfraEvidenceDiagramOutlineResourceName(fromNode)
                          : "Endpoint was not in this diagram outline";
                      const toAccessibleName =
                        toNode != null
                          ? resolveInfraEvidenceDiagramOutlineResourceName(toNode)
                          : "Endpoint was not in this diagram outline";

                      return (
                        <tr
                          key={`${edge.from}-${edge.to}-${index}`}
                          className="border-t border-neutral-200 dark:border-neutral-800"
                        >
                          <td className="px-3 py-2">
                            {edge.source === "declared" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                data-testid={`infra-diagrams-declared-edge-${edge.from}-${edge.to}`}
                                aria-label={`View declared connection from ${fromAccessibleName} to ${toAccessibleName}`}
                                onClick={() => {
                                  selectInventoryEdge(null);
                                  setSelectedDeclaredEdge(edge);
                                }}
                              >
                                {formatOutlineEdgeSource(edge.source, edge.provenanceKind)}
                              </Button>
                            ) : edge.source === "observed"
                              || edge.source === "probable"
                              || edge.source === "inferred" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                data-testid={`infra-diagrams-inventory-edge-${edge.from}-${edge.to}`}
                                aria-label={`View connection evidence from ${fromAccessibleName} to ${toAccessibleName}`}
                                onClick={() => {
                                  setSelectedDeclaredEdge(null);
                                  selectInventoryEdge(edge);
                                }}
                              >
                                {formatOutlineEdgeSource(edge.source, edge.provenanceKind)}
                              </Button>
                            ) : (
                              formatOutlineEdgeSource(edge.source, edge.provenanceKind)
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {fromNode != null ? (
                              <InfraEvidenceDiagramOutlineNodeLabel node={fromNode} />
                            ) : (
                              resolveInfraEvidenceOutlineNodeLabel(outline.nodes, edge.from)
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {formatOutlineCell(
                              resolveInfraEvidenceOutlineEdgeLabel(edge, outline.nodes),
                              "Edge label was not stored",
                            )}
                          </td>
                          <td className="px-3 py-2">{toDisplay}</td>
                        </tr>
                      );
                      })}
                    </tbody>
                  ))}
                </table>
                {edgeRows.length === 0 ? (
                  <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    No edges were parsed from this diagram source. That is not a stored finding that the architecture has no relationships.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {outline.dropGateRows != null ? (
          outline.dropGateRows.length > 0 ? (
            <section
              data-testid="infra-diagrams-outline-drop-gates"
              aria-label={`Dropped relationships (${outline.dropGateRows.length})`}
            >
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Dropped relationships ({outline.dropGateRows.length})
              </h3>
              <ul className={cn("m-0 list-disc pl-5", OPERATOR_TYPOGRAPHY.body)}>
                {outline.dropGateRows.map((row, index) => (
                  <li key={`${row.from}-${row.to}-${row.reason}-${index}`}>
                    {formatLedgerDropLabel(row, outline.nodes)}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-diagrams-outline-drop-gates-empty"
            >
              Drop gate evaluation returned no dropped relationships for this outline.
            </p>
          )
        ) : (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-diagrams-outline-drop-gates-missing"
          >
            Drop gate rows were not stored on this outline.
          </p>
        )}
      </div>
    </div>
  );
}
