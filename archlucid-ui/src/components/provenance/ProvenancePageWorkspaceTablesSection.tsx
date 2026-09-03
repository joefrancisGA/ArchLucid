"use client";

import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { MessageSquareText, Search } from "lucide-react";

import { ProvenanceReferenceLink } from "@/components/ProvenanceReferenceLink";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerTrailEdgeDisplayPhrase } from "@/lib/graph-mapper";
import {
  PROVENANCE_SECTION_LINKAGE_POINTS_LABEL,
  PROVENANCE_SECTION_RELATIONSHIPS_LABEL,
} from "@/lib/provenance-evidence-copy";
import {
  provenanceEdgeDisplayLabel,
  provenanceNodeDisplayName,
  provenanceNodeTypeLabel,
} from "@/lib/provenance-node-presentation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

import { provenanceViewPanelProps } from "./ProvenanceViewModeSwitcher";
import { SEARCH_THRESHOLD } from "./use-provenance-page-workspace";

type ProvenanceGraphNode = ArchitectureRunProvenanceGraph["nodes"][number];
type ProvenanceGraphEdge = ArchitectureRunProvenanceGraph["edges"][number];

export type ProvenancePageWorkspaceTablesSectionProps = {
  readonly runId: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly selectedNodeId: string | null;
  readonly highlightedEdgeId: string | null;
  readonly nodeSearch: string;
  readonly setNodeSearch: Dispatch<SetStateAction<string>>;
  readonly nodeTypeFilter: string;
  readonly setNodeTypeFilter: Dispatch<SetStateAction<string>>;
  readonly edgeSearch: string;
  readonly setEdgeSearch: Dispatch<SetStateAction<string>>;
  readonly edgesExpanded: boolean;
  readonly setEdgesExpanded: Dispatch<SetStateAction<boolean>>;
  readonly filteredNodesForTable: ProvenanceGraphNode[];
  readonly filteredEdgesForTable: ProvenanceGraphEdge[];
  readonly nodeTypes: string[];
  readonly nodeById: Map<string, ProvenanceGraphNode>;
  readonly onSelectNode: (nodeId: string) => void;
  readonly onSelectEdge: (edgeId: string) => void;
};

export function ProvenancePageWorkspaceTablesSection(
  props: ProvenancePageWorkspaceTablesSectionProps,
): React.JSX.Element {
  const {
    runId,
    graph,
    selectedNodeId,
    highlightedEdgeId,
    nodeSearch,
    setNodeSearch,
    nodeTypeFilter,
    setNodeTypeFilter,
    edgeSearch,
    setEdgeSearch,
    edgesExpanded,
    setEdgesExpanded,
    filteredNodesForTable,
    filteredEdgesForTable,
    nodeTypes,
    nodeById,
    onSelectNode,
    onSelectEdge,
  } = props;

  return (
    <>
      <section className="scroll-mt-28" {...provenanceViewPanelProps("table", true)}>
        <h3 id="prov-nodes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {PROVENANCE_SECTION_LINKAGE_POINTS_LABEL}
        </h3>
        {graph.nodes.length >= SEARCH_THRESHOLD ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-400" aria-hidden="true" />
              <Input
                value={nodeSearch}
                onChange={(event) => setNodeSearch(event.target.value)}
                placeholder="Search nodes"
                className="pl-8"
                aria-label="Search nodes"
              />
            </div>
            <label className="flex items-center gap-2">
              <span className={cn("sr-only", OPERATOR_TYPOGRAPHY.helper)}>Filter by type</span>
              <select
                className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                value={nodeTypeFilter}
                onChange={(event) => setNodeTypeFilter(event.target.value)}
                aria-label="Filter nodes by type"
              >
                <option value="">All types</option>
                {nodeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        <div className="mt-3">
          <EnterpriseTable
            ariaLabel={PROVENANCE_SECTION_LINKAGE_POINTS_LABEL}
            className={OPERATOR_TYPOGRAPHY.body}
            data-testid="provenance-nodes-table"
          >
            <caption className="sr-only">{PROVENANCE_SECTION_LINKAGE_POINTS_LABEL}</caption>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow className="border-b-2 border-neutral-300 dark:border-neutral-600">
                <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                  Name
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                  Type
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                  Reference
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                  <span className="sr-only">Explain</span>
                </EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {filteredNodesForTable.length === 0 ? (
                <EnterpriseTableRow>
                  <EnterpriseTableCell
                    colSpan={4}
                    className="border-b border-neutral-100 p-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                  >
                    {graph.nodes.length === 0
                      ? "No linkage points recorded for this review."
                      : "No linkage points match your search or type filter."}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ) : (
                filteredNodesForTable.map((node) => {
                  const selected = selectedNodeId === node.id;

                  return (
                    <EnterpriseTableRow
                      key={node.id}
                      id={`prov-node-row-${node.id}`}
                      className={cn(
                        "transition-colors",
                        selected ? "bg-[color-mix(in_srgb,var(--al-accent-interactive)_12%,transparent)]" : "",
                      )}
                    >
                      <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top font-medium dark:border-neutral-800">
                        <button
                          type="button"
                          className="text-left font-medium text-neutral-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:text-neutral-100"
                          onClick={() => onSelectNode(node.id)}
                        >
                          {provenanceNodeDisplayName(node)}
                        </button>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                        {provenanceNodeTypeLabel(node.type)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="break-all border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                        <ProvenanceReferenceLink runId={runId} referenceId={node.referenceId} nodes={graph.nodes} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Explain ${provenanceNodeDisplayName(node)}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectNode(node.id);
                          }}
                        >
                          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })
              )}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      </section>

      <section id="prov-edges" aria-labelledby="prov-edges-heading" className="scroll-mt-28">
        <div className="flex items-center justify-between gap-2">
          <h3 id="prov-edges-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {PROVENANCE_SECTION_RELATIONSHIPS_LABEL}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            aria-expanded={edgesExpanded}
            onClick={() => setEdgesExpanded((value) => !value)}
          >
            {edgesExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
        {edgesExpanded ? (
          <>
            {graph.edges.length >= SEARCH_THRESHOLD ? (
              <div className="relative mt-3 max-w-md">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-400" aria-hidden="true" />
                <Input
                  value={edgeSearch}
                  onChange={(event) => setEdgeSearch(event.target.value)}
                  placeholder="Search edges"
                  className="pl-8"
                  aria-label="Search edges"
                />
              </div>
            ) : null}
            <div className="mt-3">
              <EnterpriseTable
                ariaLabel={PROVENANCE_SECTION_RELATIONSHIPS_LABEL}
                className={OPERATOR_TYPOGRAPHY.body}
                data-testid="provenance-edges-table"
              >
                <caption className="sr-only">{PROVENANCE_SECTION_RELATIONSHIPS_LABEL}</caption>
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow className="border-b-2 border-neutral-300 dark:border-neutral-600">
                    <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                      Relationship
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                      Type
                    </EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {filteredEdgesForTable.length === 0 ? (
                    <EnterpriseTableRow>
                      <EnterpriseTableCell
                        colSpan={2}
                        className="border-b border-neutral-100 p-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                      >
                        {graph.edges.length === 0
                          ? "No relationships recorded for this review."
                          : "No relationships match your search."}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ) : (
                    filteredEdgesForTable.map((edge) => {
                      const highlighted = highlightedEdgeId === edge.id;

                      return (
                        <EnterpriseTableRow
                          key={edge.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40",
                            highlighted
                              ? "bg-[color-mix(in_srgb,var(--al-accent-interactive)_12%,transparent)]"
                              : "",
                          )}
                          onClick={() => onSelectEdge(edge.id)}
                        >
                          <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                            {provenanceEdgeDisplayLabel(edge, nodeById)}
                          </EnterpriseTableCell>
                          <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                            {buyerTrailEdgeDisplayPhrase(edge.type)}
                          </EnterpriseTableCell>
                        </EnterpriseTableRow>
                      );
                    })
                  )}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </div>
          </>
        ) : (
          <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {graph.edges.length} relationships recorded. Expand to inspect edge types and endpoints.
          </p>
        )}
      </section>
    </>
  );
}
