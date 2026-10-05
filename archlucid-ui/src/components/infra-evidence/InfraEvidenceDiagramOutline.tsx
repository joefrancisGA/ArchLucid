"use client";

import { useEffect, useMemo, useState } from "react";

import { InfraEvidenceDeclaredConnectionDetailPanel } from "@/components/infra-evidence/InfraEvidenceDeclaredConnectionDetailPanel";
import { InfraEvidenceInventoryEdgeDetailPanel } from "@/components/infra-evidence/InfraEvidenceInventoryEdgeDetailPanel";
import { Button } from "@/components/ui/button";
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
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNATTACHED_NSG_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNCONNECTED_SECTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_EMPTY_DETAIL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_USED_SECTION,
} from "@/lib/governance/governance-infrastructure-copy";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import { resolveInfraEvidenceOutlineEdgeToDisplay } from "@/lib/infra-evidence/format-infra-evidence-outline-edge-to-label";
import {
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_COLUMN,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_OUTLINE_SOURCE_PROBABLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import { InfraEvidenceDiagramOutlineNodeLabel } from "@/lib/infra-evidence/infra-evidence-diagram-outline-node-label";
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
import {
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

type ConnectionStateKey = "Connected" | "Used" | "Orphaned" | "Unconnected" | "Unknown";

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

    default:
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_SECTION;
  }
}

function resolveUnknownNodeReason(node: InfraEvidenceMermaidOutlineNode): string {
  const details = node.unresolvedRelationshipDetails ?? [];

  if (details.length > 0) {
    return details.join(" ");
  }

  const separatorIndex = node.label.indexOf(" · ");

  if (separatorIndex >= 0) {
    const problem = node.label.slice(separatorIndex + 3).trim();

    if (problem.length > 0) {
      return problem;
    }
  }

  return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNKNOWN_EMPTY_DETAIL;
}

function formatLedgerDropLabel(
  drop: { readonly reason: string; readonly from: string; readonly to: string | null },
  nodes: readonly InfraEvidenceMermaidOutlineNode[],
): string {
  const fromLabel = resolveInfraEvidenceOutlineNodeLabel(nodes, drop.from);

  if (drop.reason === "nsg-unattached") {
    return `${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNATTACHED_NSG_LABEL} · ${fromLabel}`;
  }

  const toLabel = drop.to == null ? "—" : resolveInfraEvidenceOutlineNodeLabel(nodes, drop.to);

  return `${drop.reason} · ${fromLabel} → ${toLabel}`;
}

type InfraEvidenceDiagramOutlineProps = {
  readonly outline: InfraEvidenceMermaidOutline;
  readonly onFocusNeighborhood?: (node: InfraEvidenceMermaidOutlineNode) => void;
  readonly defaultNodesOpen?: boolean;
  readonly defaultEdgesOpen?: boolean;
};

function formatOutlineCell(value: string | null): string {
  if (value == null || value.trim().length === 0) {
    return "Not recorded";
  }

  return value;
}

function formatOutlineResourceType(resourceType: string | null): string {
  return formatOutlineCell(formatDiagramArmTypeFriendlyName(resourceType));
}

function formatOutlineEdgeSource(source: InfraEvidenceDiagramOutlineEdgeSource): string {
  switch (source) {
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
    sectionTestId,
    showProblem = false,
    nodeSortKey,
    nodeSortDir,
    onSort,
    showNeighborhoodActions,
    onFocusNeighborhood,
  } = props;

  return (
    <section
      className="flex flex-col gap-2"
      data-testid={sectionTestId}
      aria-label={`${sectionLabel} (${nodes.length})`}
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {sectionLabel} ({nodes.length})
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
                  {formatOutlineCell(node.resourceGroup)}
                </td>
                {showProblem ? (
                  <td className={cn("px-3 py-2", OPERATOR_TYPOGRAPHY.body)}>
                    {resolveUnknownNodeReason(node)}
                  </td>
                ) : null}
                {showNeighborhoodActions ? (
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid={`infra-diagrams-focus-neighborhood-${node.id}`}
                      aria-label={`${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION} from ${node.label}`}
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
    defaultNodesOpen = false,
    defaultEdgesOpen = false,
  } = props;
  const [nodeSortKey, setNodeSortKey] = useState(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY);
  const [nodeSortDir, setNodeSortDir] = useState<"asc" | "desc">(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR);
  const [edgeSortKey, setEdgeSortKey] = useState(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_KEY);
  const [edgeSortDir, setEdgeSortDir] = useState<"asc" | "desc">(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_DIR);
  const [nodesOpen, setNodesOpen] = useState(defaultNodesOpen);
  const [edgesOpen, setEdgesOpen] = useState(defaultEdgesOpen);
  const [selectedDeclaredEdge, setSelectedDeclaredEdge] = useState<InfraEvidenceMermaidOutlineEdge | null>(null);
  const [selectedInventoryEdge, setSelectedInventoryEdge] = useState<InfraEvidenceMermaidOutlineEdge | null>(null);
  const [declaredConnections, setDeclaredConnections] = useState<SecurityDeclaredConnectionRow[]>([]);
  const [declaredConnectionsLoading, setDeclaredConnectionsLoading] = useState(false);
  const [declaredConnectionsError, setDeclaredConnectionsError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDeclaredEdge(null);
    setSelectedInventoryEdge(null);
    setDeclaredConnections([]);
    setDeclaredConnectionsError(null);
  }, [outline]);

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
    const stateByNodeId = new Map<string, InfraEvidenceMermaidOutlineNode["connectionState"]>();

    for (const node of outline.nodes) {
      stateByNodeId.set(node.id, node.connectionState);
    }

    for (const node of allConnectedNodes) {
      if (stateByNodeId.get(node.id) == null) {
        stateByNodeId.set(node.id, "Connected");
      }
    }

    for (const node of allUnconnectedNodes) {
      if (stateByNodeId.get(node.id) == null) {
        stateByNodeId.set(node.id, "Unknown");
      }
    }

    const rows = new Map<string, readonly InfraEvidenceMermaidOutlineNode[]>();
    for (const state of ["Connected", "Used", "Orphaned", "Unconnected", "Unknown"] as const) {
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
  const showEdgesSection = outline.edges.length > 0;
  const ledgerDropsKnown = Array.isArray(outline.ledgerDrops);
  const showLedgerSection = ledgerDropsKnown && outline.ledgerDrops.length > 0;
  const ledgerDropsNotReturned = !ledgerDropsKnown;

  const showNeighborhoodActions = onFocusNeighborhood != null;

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
            Download the structured evidence behind this diagram.
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
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="infra-diagrams-unknown-questions"
                  >
                    {unknownNodes.length === 1
                      ? "ArchLucid has a question about 1 resource."
                      : `ArchLucid has questions about ${unknownNodes.length} resources.`}
                  </p>
                ) : null}
                {(["Connected", "Used", "Orphaned", "Unconnected", "Unknown"] as const).map((state) => {
                  const nodes = stateRows.get(state) ?? [];

                  if (nodes.length === 0) {
                    return null;
                  }

                  return (
                  <InfraEvidenceDiagramOutlineNodeTable
                    key={state}
                    nodes={nodes}
                    sectionLabel={resolveOutlineConnectionStateSectionLabel(state)}
                    sectionTestId={`infra-diagrams-${state.toLowerCase()}-nodes-list`}
                    showProblem={state === "Orphaned" || state === "Unknown"}
                    nodeSortKey={nodeSortKey}
                    nodeSortDir={nodeSortDir}
                    onSort={handleNodeSort}
                    showNeighborhoodActions={showNeighborhoodActions}
                    onFocusNeighborhood={onFocusNeighborhood}
                  />
                  );
                })}
                {ledgerDropsNotReturned ? (
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="infra-diagrams-ledger-drops-not-returned"
                  >
                    Ledger drops not returned
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
                  <div className="mb-4">
                    <InfraEvidenceInventoryEdgeDetailPanel
                      edge={selectedInventoryEdge}
                      onClose={() => {
                        setSelectedInventoryEdge(null);
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
                          {formatOutlineEdgeSource(group.source)} edges ({group.rows.length})
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
                                aria-label={`View declared connection from ${fromNode?.label ?? edge.from} to ${toNode?.label ?? edge.to}`}
                                onClick={() => {
                                  setSelectedInventoryEdge(null);
                                  setSelectedDeclaredEdge(edge);
                                }}
                              >
                                {formatOutlineEdgeSource(edge.source)}
                              </Button>
                            ) : edge.source === "probable" || edge.source === "inferred" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                data-testid={`infra-diagrams-inventory-edge-${edge.from}-${edge.to}`}
                                aria-label={`View connection evidence from ${fromNode?.label ?? edge.from} to ${toNode?.label ?? edge.to}`}
                                onClick={() => {
                                  setSelectedDeclaredEdge(null);
                                  setSelectedInventoryEdge(edge);
                                }}
                              >
                                {formatOutlineEdgeSource(edge.source)}
                              </Button>
                            ) : (
                              formatOutlineEdgeSource(edge.source)
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {fromNode != null ? (
                              <InfraEvidenceDiagramOutlineNodeLabel node={fromNode} />
                            ) : (
                              resolveInfraEvidenceOutlineNodeLabel(outline.nodes, edge.from)
                            )}
                          </td>
                          <td className="px-3 py-2">{formatOutlineCell(resolveInfraEvidenceOutlineEdgeLabel(edge, outline.nodes))}</td>
                          <td className="px-3 py-2">{toDisplay}</td>
                        </tr>
                      );
                      })}
                    </tbody>
                  ))}
                </table>
                {edgeRows.length === 0 ? (
                  <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    No edges parsed from the Mermaid source.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {outline.dropGateRows != null && outline.dropGateRows.length > 0 ? (
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
                  {row.reason}: {resolveInfraEvidenceOutlineNodeLabel(outline.nodes, row.from)} →{" "}
                  {resolveInfraEvidenceOutlineNodeLabel(outline.nodes, row.to)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
