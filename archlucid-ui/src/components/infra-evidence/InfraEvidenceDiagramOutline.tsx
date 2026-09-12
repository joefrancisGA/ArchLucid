"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR,
  DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY,
  sortDirectionForInfraEvidenceDiagramOutlineNodeColumn,
  sortInfraEvidenceDiagramOutlineNodes,
  toggleInfraEvidenceDiagramOutlineNodeSort,
  type InfraEvidenceDiagramOutlineNodeSortKey,
} from "@/lib/infra-evidence/infra-evidence-diagram-outline-sort";
import {
  resolveInfraEvidenceOutlineNodeLabel,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

type InfraEvidenceDiagramOutlineProps = {
  readonly outline: InfraEvidenceMermaidOutline;
};

function formatOutlineCell(value: string | null): string {
  if (value == null || value.trim().length === 0) {
    return "—";
  }

  return value;
}

function InfraEvidenceDiagramOutlineSortableHeader(props: {
  readonly column: InfraEvidenceDiagramOutlineNodeSortKey;
  readonly label: string;
  readonly sortKey: InfraEvidenceDiagramOutlineNodeSortKey;
  readonly sortDir: "asc" | "desc";
  readonly onSort: (column: InfraEvidenceDiagramOutlineNodeSortKey) => void;
}): React.JSX.Element {
  const isActive = props.sortKey === props.column;
  const directionLabel = props.sortDir === "asc" ? "ascending" : "descending";

  return (
    <th
      className="px-3 py-2 font-medium"
      scope="col"
      aria-sort={sortDirectionForInfraEvidenceDiagramOutlineNodeColumn(props.sortKey, props.column, props.sortDir)}
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

/** Structured list alternative to the Mermaid canvas (WCAG 1.1.1 peer affordance). */
export function InfraEvidenceDiagramOutline(props: InfraEvidenceDiagramOutlineProps): React.JSX.Element {
  const { outline } = props;
  const [nodeSortKey, setNodeSortKey] = useState(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY);
  const [nodeSortDir, setNodeSortDir] = useState<"asc" | "desc">(DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR);

  const nodeRows = useMemo(() => {
    const sortedNodes = sortInfraEvidenceDiagramOutlineNodes(outline.nodes, nodeSortKey, nodeSortDir);

    return sortedNodes.slice(0, 200);
  }, [nodeSortDir, nodeSortKey, outline.nodes]);
  const edgeRows = outline.edges.slice(0, 200);

  const handleNodeSort = (column: InfraEvidenceDiagramOutlineNodeSortKey) => {
    const next = toggleInfraEvidenceDiagramOutlineNodeSort(nodeSortKey, nodeSortDir, column);

    setNodeSortKey(next.sortKey);
    setNodeSortDir(next.sortDir);
  };

  return (
    <div
      data-testid="infra-diagrams-mermaid-outline"
      className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-700"
    >
      <div className="flex flex-col gap-4 p-3">
        <div>
          <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>Nodes</h3>
          <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <InfraEvidenceDiagramOutlineSortableHeader
                  column="label"
                  label="Label"
                  sortKey={nodeSortKey}
                  sortDir={nodeSortDir}
                  onSort={handleNodeSort}
                />
                <InfraEvidenceDiagramOutlineSortableHeader
                  column="resourceType"
                  label="Resource type"
                  sortKey={nodeSortKey}
                  sortDir={nodeSortDir}
                  onSort={handleNodeSort}
                />
                <InfraEvidenceDiagramOutlineSortableHeader
                  column="resourceGroup"
                  label="Resource group"
                  sortKey={nodeSortKey}
                  sortDir={nodeSortDir}
                  onSort={handleNodeSort}
                />
              </tr>
            </thead>
            <tbody>
              {nodeRows.map((node) => (
                <tr key={node.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-3 py-2">{node.label}</td>
                  <td className="px-3 py-2 font-mono text-sm">{formatOutlineCell(node.resourceType)}</td>
                  <td className="px-3 py-2 font-mono text-sm">{formatOutlineCell(node.resourceGroup)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {nodeRows.length === 0 ? (
            <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              No nodes parsed from the Mermaid source.
            </p>
          ) : null}
        </div>
        <div>
          <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>Edges</h3>
          <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th className="px-3 py-2 font-medium">From</th>
                <th className="px-3 py-2 font-medium">To</th>
              </tr>
            </thead>
            <tbody>
              {edgeRows.map((edge, index) => (
                <tr
                  key={`${edge.from}-${edge.to}-${index}`}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-3 py-2">{resolveInfraEvidenceOutlineNodeLabel(outline.nodes, edge.from)}</td>
                  <td className="px-3 py-2">{resolveInfraEvidenceOutlineNodeLabel(outline.nodes, edge.to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {edgeRows.length === 0 ? (
            <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              No edges parsed from the Mermaid source.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
