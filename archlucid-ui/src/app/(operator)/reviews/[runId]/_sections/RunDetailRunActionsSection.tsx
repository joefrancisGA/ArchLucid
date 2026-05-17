import Link from "next/link";
import type { ReactElement } from "react";

import { FunnelTelemetryExportAnchor } from "@/components/FunnelTelemetryExportAnchor";
import { GenerateSponsorValueReportButton } from "@/components/GenerateSponsorValueReportButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { getTraceabilityBundleDownloadUrl } from "@/lib/api";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailRunActionsSectionProps = {
  readonly runId: string;
  readonly manifestId: string | null | undefined;
};

export function RunDetailRunActionsSection(props: RunDetailRunActionsSectionProps): ReactElement {
  const { runId, manifestId } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section id="run-actions" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Actions</h3>
          <CardDescription>
            <>
              Exports and sponsor-facing bundles sit in <strong>Deliverables & exports</strong> above. Use this card for
              scorecard generation and traceability ZIP
              {buyerPolishedShell ? "." : ", and optional compare shortcuts."}
            </>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {manifestId ? <GenerateSponsorValueReportButton /> : null}
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" asChild>
              <FunnelTelemetryExportAnchor href={getTraceabilityBundleDownloadUrl(runId)}>
                Download traceability bundle (ZIP)
              </FunnelTelemetryExportAnchor>
            </Button>
            {buyerPolishedShell ? null : (
            <Button variant="outline" size="sm" asChild>
              <Link href={comparePageHrefAdaptive(runId)}>Compare two reviews (baseline = this review)</Link>
            </Button>
            )}
            {manifestId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/executive/reviews/${encodeURIComponent(runId)}`}>Open Executive Summary</Link>
              </Button>
            ) : null}
          </div>
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="#agent-forensics">
              Pipeline diagnostics
            </Link>
            {" — "}
            optional detail for operators troubleshooting pipeline steps.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
