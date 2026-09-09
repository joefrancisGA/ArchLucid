"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import { GenerateSponsorValueReportButton } from "@/components/GenerateSponsorValueReportButton";
import { ShareReviewPackageButton } from "@/components/ShareReviewPackageButton";
import { ReviewArchiveControl } from "@/components/reviews/ReviewArchiveControl";
import { ReviewPackageWhatIfControl } from "@/components/reviews/ReviewPackageWhatIfControl";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { downloadTraceabilityBundleZip } from "@/lib/api/downloads-blob-trigger-artifact-bundle";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { artifactBundleMutationBlockedReason } from "@/lib/runs/artifact-bundle-mutation-blocked-reason";
import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";
import { exportVerifyBlockedRecovery } from "@/lib/exports/export-verify-recovery-copy";
import {
  isRunExportLineageAttested,
  verifyRunExportLineage,
} from "@/lib/exports/run-export-lineage-verify";
import { showError } from "@/lib/toast";
import { buildCompareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useProductionDeskChrome, useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { RunDetailRunGovernanceDispositionActions } from "@/components/runs/RunDetailRunGovernanceDispositionActions";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailRunActionsSectionProps = {
  readonly runId: string;
  readonly systemName: string;
  readonly manifestId: string | null | undefined;
  readonly manifestVersion?: string | null;
  readonly hasCommitBlockingFailures: boolean;
  readonly operatorGovernanceDecision?: string | null;
  readonly isArchived?: boolean;
  readonly pipelineInFlight?: boolean;
  /** Guided/sample reviews may skip export verify (DR-10). */
  readonly isSample?: boolean;
};

export function RunDetailRunActionsSection(props: RunDetailRunActionsSectionProps): ReactElement {
  const { runId, systemName, manifestId, manifestVersion, hasCommitBlockingFailures, operatorGovernanceDecision = null } = props;
  const evalChromeShell = useProductionEvalChrome();
  const workingDesk = useProductionDeskChrome();
  const packageCommitted =
    manifestId !== null && manifestId !== undefined && manifestId.trim().length > 0;
  const sealedManifestVersion = manifestVersion ?? (packageCommitted ? manifestId?.trim() ?? null : null);
  const collateralExportBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion: sealedManifestVersion,
  });
  const [traceabilityBusy, setTraceabilityBusy] = useState(false);
  const [traceabilityRecovery, setTraceabilityRecovery] = useState<ErrorRecoveryContractPresentation | null>(null);

  const onDownloadTraceabilityBundle = useCallback(async () => {
    if (collateralExportBlockedReason !== null) {
      return;
    }

    setTraceabilityRecovery(null);

    try {
      if (workingDesk && props.isSample !== true) {
        const verifyResult = await verifyRunExportLineage(runId);

        if (!isRunExportLineageAttested(verifyResult)) {
          setTraceabilityRecovery(exportVerifyBlockedRecovery(verifyResult));

          return;
        }
      }

      await downloadTraceabilityBundleZip(runId);
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blocked = artifactBundleMutationBlockedReason(failure);

      showError("Evidence bundle", blocked ?? failure.message);
    } finally {
      setTraceabilityBusy(false);
    }
  }, [collateralExportBlockedReason, props.isSample, runId, workingDesk]);

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
            committed={packageCommitted}
            manifestVersion={sealedManifestVersion}
          />
          <ReviewPackageWhatIfControl
            runId={runId}
            packageCommitted={packageCommitted}
            pipelineInFlight={props.pipelineInFlight === true}
          />
          <div className="flex flex-wrap gap-3">
            {collateralExportBlockedReason !== null ? (
              <div className="flex flex-col gap-1">
                <Button variant="secondary" size="sm" disabled data-testid="run-actions-traceability-bundle-blocked">
                  Download evidence bundle (ZIP)
                </Button>
                <p
                  role="alert"
                  className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="run-actions-traceability-bundle-blocked-reason"
                >
                  {collateralExportBlockedReason}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={traceabilityBusy}
                  onClick={() => {
                    void onDownloadTraceabilityBundle();
                  }}
                  data-testid="run-actions-traceability-bundle-download"
                >
                  {traceabilityBusy ? "Preparing evidence bundle…" : "Download evidence bundle (ZIP)"}
                </Button>
                {traceabilityRecovery !== null ? (
                  <OperatorErrorRecoveryContract
                    presentation={traceabilityRecovery}
                    testId="run-actions-traceability-bundle-recovery"
                  />
                ) : null}
              </div>
            )}
            {evalChromeShell ? null : (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildCompareTwoReviewsHref({ baseRunId: runId })}>
                Compare two reviews (baseline = this review)
              </Link>
            </Button>
            )}
            {manifestId && !evalChromeShell ? (
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
