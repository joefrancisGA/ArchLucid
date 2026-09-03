"use client";

import { ProvenanceReferenceLink } from "@/components/ProvenanceReferenceLink";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { provenanceViewPanelProps } from "@/components/provenance/ProvenanceViewModeSwitcher";
import type { ProvenanceViewMode } from "@/components/provenance/ProvenanceViewModeSwitcher";
import { PROVENANCE_SECTION_TRACE_TIMELINE_LABEL } from "@/lib/provenance-evidence-copy";
import {
  provenanceTimelinePrimaryLabel,
  provenanceTimelineShowsTechnicalKind,
  provenanceTimelineTechnicalKind,
} from "@/lib/provenance-timeline-presentation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { formatProvenancePageWorkspaceUtc } from "./provenance-page-workspace-presentation";

export type ProvenancePageWorkspaceTimelineProps = {
  readonly runId: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly viewMode: ProvenanceViewMode;
  readonly onSelectNode: (nodeId: string) => void;
};

export function ProvenancePageWorkspaceTimeline({
  runId,
  graph,
  viewMode,
  onSelectNode,
}: ProvenancePageWorkspaceTimelineProps) {
  return (
    <section
      className="scroll-mt-28"
      {...(viewMode === "timeline"
        ? provenanceViewPanelProps("timeline", true)
        : { id: "prov-timeline", "aria-labelledby": "prov-timeline-heading" })}
    >
      <h3 id="prov-timeline-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {PROVENANCE_SECTION_TRACE_TIMELINE_LABEL}
      </h3>
      <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        Ordered events from review lifecycle and finalized decisions.
      </p>
      <EnterpriseTable
        ariaLabel={PROVENANCE_SECTION_TRACE_TIMELINE_LABEL}
        className={OPERATOR_TYPOGRAPHY.body}
        data-testid="provenance-timeline-table"
      >
        <caption className="sr-only">{PROVENANCE_SECTION_TRACE_TIMELINE_LABEL}</caption>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow className="border-b-2 border-neutral-300 dark:border-neutral-600">
            <EnterpriseTableHeaderCell
              scope="col"
              className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50"
            >
              Time (UTC)
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell
              scope="col"
              className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50"
            >
              Event
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell
              scope="col"
              className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50"
            >
              Reference
            </EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {graph.timeline.length === 0 ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell
                colSpan={3}
                className="border-b border-neutral-100 p-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
              >
                No recorded events for this review.
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : (
            graph.timeline.map((row) => {
              const relatedNode = graph.nodes.find((node) => node.referenceId === row.referenceId);
              const primaryLabel = provenanceTimelinePrimaryLabel(row);

              return (
                <EnterpriseTableRow
                  key={`${row.timestampUtc}-${row.kind}-${row.referenceId ?? row.label}`}
                  className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                >
                  <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top whitespace-nowrap dark:border-neutral-800">
                    <time dateTime={row.timestampUtc}>{formatProvenancePageWorkspaceUtc(row.timestampUtc)}</time>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                    {relatedNode !== undefined ? (
                      <button
                        type="button"
                        className="text-left font-medium text-neutral-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:text-neutral-100"
                        onClick={() => onSelectNode(relatedNode.id)}
                      >
                        {primaryLabel}
                      </button>
                    ) : (
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{primaryLabel}</span>
                    )}
                    {provenanceTimelineShowsTechnicalKind(row) ? (
                      <details className="mt-1">
                        <summary
                          className={cn(
                            "cursor-pointer text-neutral-600 dark:text-neutral-400",
                            OPERATOR_TYPOGRAPHY.micro,
                          )}
                        >
                          Technical event kind
                        </summary>
                        <p className={cn("m-0 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                          {provenanceTimelineTechnicalKind(row)}
                        </p>
                      </details>
                    ) : null}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="break-all border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                    <ProvenanceReferenceLink runId={runId} referenceId={row.referenceId} nodes={graph.nodes} />
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })
          )}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
