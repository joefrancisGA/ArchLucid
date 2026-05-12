import type { ReactElement } from "react";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { RunTraceViewerLink } from "@/components/RunTraceViewerLink";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { RunDetail } from "@/types/authority";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailRunMetadataSectionProps = {
  readonly run: RunDetail["run"];
  readonly runDetailTraceId: string | null;
};

/** Full-operator run metadata + trace links before manifest is summarized on this page. */
export function RunDetailRunMetadataSection(props: RunDetailRunMetadataSectionProps): ReactElement {
  const { run, runDetailTraceId } = props;

  return (
    <section id="run-metadata" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Review</h3>
          <CardDescription>
            Manifest summary and artifacts appear below when <GlossaryTooltip termKey="run">this review</GlossaryTooltip> has a{" "}
            <GlossaryTooltip termKey="golden_manifest">reviewed manifest</GlossaryTooltip> (after finalization).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
          <RunTraceViewerLink traceId={runDetailTraceId} />
          {run.otelTraceId ? (
            <p className="m-0">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Creation trace:</span>{" "}
              <RunTraceViewerLink traceId={run.otelTraceId} />
            </p>
          ) : null}
          <p className="m-0">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Description:</span>{" "}
            {run.description ?? ""}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
