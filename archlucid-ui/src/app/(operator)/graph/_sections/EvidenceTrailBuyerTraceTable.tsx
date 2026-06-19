"use client";

import Link from "next/link";

import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { Button } from "@/components/ui/button";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { truncateForList } from "@/lib/truncate-for-list";
import type { FindingTraceConfidenceDto } from "@/types/explanation";

export type EvidenceTrailBuyerTraceTableProps = {
  runId: string;
  rows: FindingTraceConfidenceDto[];
  onOpenGraphView?: () => void;
};

const rowGridClass =
  "grid w-full min-w-[42rem] grid-cols-[minmax(11rem,1.5fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(7rem,1fr)_minmax(8rem,1fr)] gap-x-3 border-b border-neutral-100 px-2 py-2.5 text-sm last:border-b-0 dark:border-neutral-800";

/** Audit-oriented finding → evidence → policy → review step → package trace rows. */
export function EvidenceTrailBuyerTraceTable(props: EvidenceTrailBuyerTraceTableProps) {
  const { runId, rows, onOpenGraphView } = props;
  const runTrim = runId.trim();
  const reviewPackageHref = `/reviews/${encodeURIComponent(runTrim)}`;

  if (rows.length === 0) {
    return (
      <div
        className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="evidence-trail-trace-empty"
      >
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">No trace rows yet</p>
        <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Trace rows appear after findings are committed with explainability metadata. Switch to graph view to explore
          linked evidence visually.
        </p>
        {onOpenGraphView !== undefined ? (
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onOpenGraphView}>
            Open graph view
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700"
      data-testid="evidence-trail-trace-table"
    >
      <div
        className={`${rowGridClass} sticky top-0 z-[1] bg-neutral-100 font-semibold text-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-200`}
      >
        <div>Finding</div>
        <div>Evidence</div>
        <div>Policy</div>
        <div>Review step</div>
        <div>Package</div>
      </div>
      {rows.map((row) => {
        const titleFull =
          row.findingTitle !== null && row.findingTitle !== undefined && row.findingTitle.trim().length > 0
            ? row.findingTitle.trim()
            : "(no title)";
        const graphFocusId = preferredGraphNodeIdForFindingDeepLink(runTrim, row.findingId);
        const explainGraphHref =
          (typeof row.evidenceRefCount === "number" &&
            Number.isFinite(row.evidenceRefCount) &&
            row.evidenceRefCount > 0) ||
          graphFocusId !== null
            ? graphTrailHrefWithOptionalNode(runTrim, graphFocusId)
            : null;

        return (
          <div key={row.findingId} className={`${rowGridClass} items-start bg-white dark:bg-neutral-900/30`}>
            <div className="min-w-0">
              <div
                className="text-xs leading-snug text-neutral-800 dark:text-neutral-200"
                title={titleFull}
              >
                {truncateForList(titleFull, 120)}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" asChild>
                <Link href={`/reviews/${encodeURIComponent(runTrim)}/findings/${encodeURIComponent(row.findingId)}/inspect`}>
                  Open finding
                </Link>
              </Button>
            </div>
            <div className="min-w-0 text-xs text-neutral-700 dark:text-neutral-300">
              {explainGraphHref !== null ? (
                <FindingEvidenceLinkChip href={explainGraphHref} evidenceRefCount={row.evidenceRefCount} />
              ) : (
                "—"
              )}
            </div>
            <div className="min-w-0 break-words text-xs text-neutral-700 dark:text-neutral-300">
              {row.ruleId && row.ruleId.trim().length > 0 ? row.ruleId : "—"}
            </div>
            <div className="min-w-0 text-xs text-neutral-700 dark:text-neutral-300">
              {row.traceConfidenceLabel && row.traceConfidenceLabel.trim().length > 0
                ? row.traceConfidenceLabel
                : "—"}
            </div>
            <div className="flex min-w-0 flex-col gap-1 text-xs">
              <Link className="underline" href={reviewPackageHref}>
                Review package
              </Link>
              <Link
                className="underline"
                href={`/reviews/${encodeURIComponent(runTrim)}/findings/${encodeURIComponent(row.findingId)}`}
              >
                Finding record
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
