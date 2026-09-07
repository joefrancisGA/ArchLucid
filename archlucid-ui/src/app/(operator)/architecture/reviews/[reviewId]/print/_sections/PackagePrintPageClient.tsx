"use client";

import Link from "next/link";
import { useMemo } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { useAskRunCoverageHonestyQuery } from "@/hooks/use-ask-run-coverage-honesty-query";
import { usePackagePrintMeetingCaptureQuery } from "@/hooks/use-package-print-meeting-capture-query";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import { useOidcSessionKeepalive } from "@/hooks/use-oidc-session-keepalive";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { formatCareerExportHonestyPlainText } from "@/lib/career-export-coverage-honesty";
import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PACKAGE_PRINT_ERROR_FALLBACK,
  PACKAGE_PRINT_LOADING_LABEL,
  buildPackagePrintBackHref,
  buildPackagePrintPresentation,
  PACKAGE_PRINT_BACK_LABEL,
} from "@/lib/package-print-view";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { cn } from "@/lib/utils";

import { PackagePrintPageView } from "./PackagePrintPageView";

type PackagePrintPageClientProps = {
  readonly runId: string;
  readonly listScopedRunId?: string | null;
};

/** Client loader for the lightweight print view — run summary only (TB-2205). */
export function PackagePrintPageClient(props: PackagePrintPageClientProps): React.JSX.Element {
  const { runId, listScopedRunId = null } = props;
  const workingDesk = useProductionDeskChrome();
  const summaryQuery = useRunSummaryQuery(runId);
  const coverageHonestyQuery = useAskRunCoverageHonestyQuery(runId, {
    enabled: workingDesk && summaryQuery.isSuccess,
  });
  const meetingCaptureQuery = usePackagePrintMeetingCaptureQuery(runId, {
    enabled: summaryQuery.isSuccess,
  });

  useOidcSessionKeepalive(true);

  const failure: ApiLoadFailureState | null = useMemo(
    () => (summaryQuery.isError ? toApiLoadFailure(summaryQuery.error) : null),
    [summaryQuery.error, summaryQuery.isError],
  );

  const coverageHonestyLine = useMemo(() => {
    if (!workingDesk || summaryQuery.data === undefined) {
      return null;
    }

    const bundle = coverageHonestyQuery.data;

    if (bundle === undefined) {
      return null;
    }

    return formatCareerExportHonestyPlainText({
      runId: summaryQuery.data.runId,
      progressSummary: bundle.progressSummary ?? summaryQuery.data,
      manifestSummary: bundle.manifestSummary ?? null,
      graphSnapshot: bundle.buyerSummary.graphSnapshot ?? null,
      findingsSnapshot: bundle.buyerSummary.findingsSnapshot ?? null,
      enginesSucceeded: bundle.buyerSummary.findingCoverageSummary?.enginesSucceeded ?? null,
      workingDesk: true,
    });
  }, [coverageHonestyQuery.data, summaryQuery.data, workingDesk]);

  if (summaryQuery.isPending) {
    return (
      <p
        className={cn("p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        data-testid="package-print-loading"
      >
        {PACKAGE_PRINT_LOADING_LABEL}
      </p>
    );
  }

  if (summaryQuery.isError || summaryQuery.data === undefined) {
    return (
      <div className="space-y-3 p-4" data-testid="package-print-error">
        <OperatorApiProblem
          fallbackMessage={failure?.message ?? PACKAGE_PRINT_ERROR_FALLBACK}
          problem={failure?.problem ?? null}
          correlationId={failure?.correlationId ?? null}
        />
        <Button type="button" variant="secondary" onClick={() => void summaryQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const presentation = buildPackagePrintPresentation(summaryQuery.data, {
    coverageHonestyLine:
      workingDesk && analysisStagesCompleteOnSummary(summaryQuery.data)
        ? coverageHonestyLine
        : null,
    meetingCaptureEntries: meetingCaptureQuery.data?.entries ?? null,
  });
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion: presentation.manifestVersionForGuard ?? null,
  });

  if (sealedManifestBlockedReason !== null) {
    return (
      <div className="space-y-3 p-4 print:hidden" data-testid="package-print-blocked">
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)}
          data-testid="package-print-blocked-reason"
        >
          {sealedManifestBlockedReason}
        </p>
        <Button type="button" variant="secondary" asChild>
          <Link href={buildPackagePrintBackHref(runId, summaryQuery.data?.architectureId ?? null)} data-testid="package-print-blocked-back">
            {PACKAGE_PRINT_BACK_LABEL}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <PackagePrintPageView
      presentation={presentation}
      listScopedRunId={listScopedRunId}
      parentArchitectureId={summaryQuery.data.architectureId ?? null}
    />
  );
}
