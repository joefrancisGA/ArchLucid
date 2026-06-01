import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { RunDetail } from "@/types/authority";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

export type RunDetailProvenanceSummaryCardProps = {
  readonly runId: string;
  readonly run: RunDetail["run"];
};

/** TB-111: inline provenance context without leaving run detail. */
export function RunDetailProvenanceSummaryCard(props: RunDetailProvenanceSummaryCardProps): ReactElement {
  const { runId, run } = props;
  const architectureRequestId =
    "architectureRequestId" in run && typeof run.architectureRequestId === "string"
      ? run.architectureRequestId
      : null;

  return (
    <section id="provenance-summary" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Provenance summary</h3>
          <CardDescription>
            Snapshot and request identifiers for this review. Open the full provenance graph for coordinator linkage and
            trace timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CollapsibleSection title="Identifiers" defaultOpen>
            <dl className="m-0 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-neutral-700 dark:text-neutral-300">Context snapshot</dt>
                <dd className="mt-1 flex items-center gap-2 font-mono text-xs">
                  {run.contextSnapshotId ?? "—"}
                  {run.contextSnapshotId ? (
                    <CopyIdButton value={run.contextSnapshotId} aria-label="Copy context snapshot ID" />
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-700 dark:text-neutral-300">Graph snapshot</dt>
                <dd className="mt-1 flex items-center gap-2 font-mono text-xs">
                  {run.graphSnapshotId ?? "—"}
                  {run.graphSnapshotId ? (
                    <CopyIdButton value={run.graphSnapshotId} aria-label="Copy graph snapshot ID" />
                  ) : null}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-neutral-700 dark:text-neutral-300">Architecture request</dt>
                <dd className="mt-1 flex items-center gap-2 font-mono text-xs">
                  {architectureRequestId ?? "—"}
                  {architectureRequestId ? (
                    <CopyIdButton value={architectureRequestId} aria-label="Copy architecture request ID" />
                  ) : null}
                </dd>
              </div>
            </dl>
          </CollapsibleSection>
          <p className="m-0 text-sm">
            <Link
              className="font-medium text-teal-800 underline dark:text-teal-300"
              href={`/reviews/${encodeURIComponent(runId)}/provenance`}
            >
              View full provenance →
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
