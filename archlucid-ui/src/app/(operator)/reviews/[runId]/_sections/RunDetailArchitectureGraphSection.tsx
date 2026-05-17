import Link from "next/link";
import type { ReactElement } from "react";

import { ArchitectureGraphViewer } from "@/components/ArchitectureGraphViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailArchitectureGraphSectionProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly anchorRunCreatedUtc: string;
  readonly graphHistoryMinCreatedUtc: string;
  readonly disableTemporalBrowsing: boolean;
};

export function RunDetailArchitectureGraphSection(
  props: RunDetailArchitectureGraphSectionProps,
): ReactElement {
  const { runId, buyerPolishedArtifactTable, anchorRunCreatedUtc, graphHistoryMinCreatedUtc, disableTemporalBrowsing } =
    props;

  return (
    <section id="architecture-graph" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>
            {buyerPolishedArtifactTable ? "Evidence graph" : "Architecture graph"}
          </h3>
          <CardDescription>
            {buyerPolishedArtifactTable ? (
              <>
                Interactive traceability lives on the dedicated evidence graph page so this package view stays fast during
                walkthroughs. Use it for finding drill-down, milestone nodes, and exports.
              </>
            ) : (
              <>
                Component and relationship view derived from the architecture graph API for this review (read-only on this
                page). Open the graph explorer for review-trail layouts, filters, and exports.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {buyerPolishedArtifactTable ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
                This review links to a persisted graph snapshot used for audit and evidence navigation.
              </p>
              <Button type="button" variant="default" size="sm" asChild>
                <Link href={`/graph?runId=${encodeURIComponent(runId)}`}>Open evidence graph</Link>
              </Button>
            </div>
          ) : (
            <ArchitectureGraphViewer
              runId={runId}
              anchorRunCreatedUtc={anchorRunCreatedUtc}
              graphHistoryMinCreatedUtc={graphHistoryMinCreatedUtc}
              disableTemporalBrowsing={disableTemporalBrowsing}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
