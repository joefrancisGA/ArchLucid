"use client";

import { cn } from "@/lib/utils";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import Link from "next/link";

import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { Button } from "@/components/ui/button";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";
import { truncateForList } from "@/lib/truncate-for-list";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingTraceConfidenceDto } from "@/types/explanation";

export type EvidenceTrailBuyerTraceTableProps = {
  runId: string;
  rows: FindingTraceConfidenceDto[];
  onOpenGraphView?: () => void;
};

const rowGridClass = cn(
  "grid w-full min-w-[42rem] grid-cols-[minmax(11rem,1.5fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(7rem,1fr)_minmax(8rem,1fr)] gap-x-3 border-b border-neutral-100 px-2 py-2.5 last:border-b-0 dark:border-neutral-800",
  OPERATOR_TYPOGRAPHY.body,
);

/** Audit-oriented finding → evidence → policy → review step → package trace rows. */
export function EvidenceTrailBuyerTraceTable(props: EvidenceTrailBuyerTraceTableProps) {
  const { runId, rows, onOpenGraphView } = props;
  const runTrim = runId.trim();
  const reviewPackageHref = `/architecture/reviews/${encodeURIComponent(runTrim)}`;

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="evidence-trail-trace-empty"
      >
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">No trace rows yet</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
        className={cn(rowGridClass, "sticky top-0 z-[1] bg-neutral-100 font-semibold text-al-text-primary dark:bg-neutral-900/95")}
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
                className={cn("leading-snug text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
                title={titleFull}
              >
                {truncateForList(titleFull, 120)}
              </div>
              <Button type="button" variant="outline" size="sm" className={cn("mt-1 h-7 px-2", OPERATOR_TYPOGRAPHY.helper)} asChild>
                <Link href={getFindingEvidenceTraceHref(runTrim, row.findingId)}>
                  Open finding
                </Link>
              </Button>
            </div>
            <div className={cn("min-w-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {explainGraphHref !== null ? (
                <FindingEvidenceLinkChip href={explainGraphHref} evidenceRefCount={row.evidenceRefCount} />
              ) : (
                "—"
              )}
            </div>
            <div className={cn("min-w-0 break-words text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {row.ruleId && row.ruleId.trim().length > 0 ? row.ruleId : "—"}
            </div>
            <div className={cn("min-w-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {row.traceConfidenceLabel && row.traceConfidenceLabel.trim().length > 0
                ? row.traceConfidenceLabel
                : "—"}
            </div>
            <div className={cn("flex min-w-0 flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className="underline" href={reviewPackageHref}>
                Review
              </Link>
              <Link
                className="underline"
                href={`/architecture/reviews/${encodeURIComponent(runTrim)}/findings/${encodeURIComponent(row.findingId)}`}
                prefetch={false}
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
