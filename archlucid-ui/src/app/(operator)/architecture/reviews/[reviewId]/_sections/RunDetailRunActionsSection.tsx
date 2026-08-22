import Link from "next/link";
import type { ReactElement } from "react";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { GenerateSponsorValueReportButton } from "@/components/GenerateSponsorValueReportButton";
import { ShareReviewPackageButton } from "@/components/ShareReviewPackageButton";
import { ReviewArchiveControl } from "@/components/reviews/ReviewArchiveControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getTraceabilityBundleDownloadUrl } from "@/lib/api";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { RunDetailRunGovernanceDispositionActions } from "@/components/runs/RunDetailRunGovernanceDispositionActions";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailRunActionsSectionProps = {
  readonly runId: string;
  readonly systemName: string;
  readonly manifestId: string | null | undefined;
  readonly hasCommitBlockingFailures: boolean;
  readonly operatorGovernanceDecision?: string | null;
  readonly isArchived?: boolean;
};

export function RunDetailRunActionsSection(props: RunDetailRunActionsSectionProps): ReactElement {
  const { runId, systemName, manifestId, hasCommitBlockingFailures, operatorGovernanceDecision = null } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section id="run-actions" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Actions</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <RunDetailRunGovernanceDispositionActions
            runId={runId}
            hasCommitBlockingFailures={hasCommitBlockingFailures}
            existingDecision={operatorGovernanceDecision}
          />
          <ReviewArchiveControl
            run={{
              runId,
              hasGoldenManifest: manifestId !== null && manifestId !== undefined && manifestId.trim().length > 0,
              isArchived: props.isArchived === true,
            }}
            reviewTitle={systemName}
            redirectAfterArchive
          />
          {manifestId ? <GenerateSponsorValueReportButton /> : null}
          <ShareReviewPackageButton
            runId={runId}
            systemName={systemName}
            committed={manifestId !== null && manifestId !== undefined && manifestId.trim().length > 0}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" asChild>
              <ExportTrackedAnchor href={getTraceabilityBundleDownloadUrl(runId)}>
                Download evidence bundle (ZIP)
              </ExportTrackedAnchor>
            </Button>
            {buyerPolishedShell ? null : (
            <Button variant="outline" size="sm" asChild>
              <Link href={comparePageHrefAdaptive(runId)}>Compare two reviews (baseline = this review)</Link>
            </Button>
            )}
            {manifestId && !buyerPolishedShell ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/architecture/reviews/${encodeURIComponent(runId)}`}>Open sponsor report</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
