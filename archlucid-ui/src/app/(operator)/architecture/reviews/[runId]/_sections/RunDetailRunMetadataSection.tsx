import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { RunTraceViewerLink } from "@/components/runs/RunTraceViewerLink";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { RunSummary } from "@/types/authority";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailRunMetadataSectionProps = {
  readonly run: RunSummary;
  readonly runDetailTraceId: string | null;
};

/** Full-operator run metadata + trace links before manifest is summarized on this page. */
export function RunDetailRunMetadataSection(props: RunDetailRunMetadataSectionProps): ReactElement {
  const { run, runDetailTraceId } = props;
  const retryCount = typeof run.retryCount === "number" && Number.isFinite(run.retryCount) ? run.retryCount : 0;

  return (
    <section id="run-metadata" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Review</h3>
          <CardDescription>
            Review record summary and artifacts appear below when <GlossaryTooltip termKey="run">this review</GlossaryTooltip> has a{" "}
            <GlossaryTooltip termKey="golden_manifest">signed review record</GlossaryTooltip> (after finalization).
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <RunTraceViewerLink traceId={runDetailTraceId} />
          {run.otelTraceId ? (
            <div className="m-0">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Creation trace:</span>{" "}
              <RunTraceViewerLink traceId={run.otelTraceId} />
            </div>
          ) : null}
          <p className="m-0">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Description:</span>{" "}
            {run.description ?? ""}
          </p>
          {retryCount > 0 ? (
            <p className="m-0" data-testid="run-detail-retry-count">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Retry count:</span>{" "}
              {retryCount} — this review was re-attempted after earlier failures; check governance alerts for the last failure reason.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
