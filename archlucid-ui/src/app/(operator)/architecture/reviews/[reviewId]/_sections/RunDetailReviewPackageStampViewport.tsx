"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";

import { RunDetailReviewPackageClassificationSummary } from "./RunDetailReviewPackageClassificationSummary";
import { RunDetailReviewPackageDecisionReceiptStrip } from "./RunDetailReviewPackageDecisionReceiptStrip";
import { RunDetailInsightDensityMeasurementDenominatorStrip } from "@/components/reviews/RunDetailInsightDensityMeasurementDenominatorStrip";
import type { ManifestFeasibilityVerdict, TransparencyTrail } from "@/types/feasibility-verdict";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

export type RunDetailReviewPackageStampViewportProps = {
  readonly hasGoldenManifest: boolean;
  readonly runId: string;
  readonly suppressMeasurementDenominator?: boolean;
  readonly enginesSucceeded?: number | null;
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
  readonly analysisStagesComplete?: boolean;
  readonly graphSnapshot?: unknown;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly quickDecisionFindings?: readonly QuickDecisionFinding[];
  readonly withheldFindingCount?: number;
  readonly catalogAdvisoryEngineFailureCount?: number;
};

/** Receipt + transparency trail on the review-package stamp band (FD-05 / WA-13). */
export function RunDetailReviewPackageStampViewport(
  props: RunDetailReviewPackageStampViewportProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const feasibilityVerdict = props.feasibilityVerdict ?? null;

  if (props.hasGoldenManifest) {
    if (feasibilityVerdict === null) {
      return null;
    }

    return (
      <div className="space-y-3" data-testid="run-detail-review-package-stamp-viewport">
        <RunDetailReviewPackageClassificationSummary
          findings={props.quickDecisionFindings ?? []}
          withheldFindingCount={props.withheldFindingCount}
          catalogAdvisoryEngineFailureCount={props.catalogAdvisoryEngineFailureCount}
        />
        <RunDetailInsightDensityMeasurementDenominatorStrip
          enginesSucceeded={props.enginesSucceeded}
          suppressOnTerminalFailure={props.suppressMeasurementDenominator}
        />
        <RunDetailReviewPackageDecisionReceiptStrip
          runId={props.runId}
          feasibilityVerdict={feasibilityVerdict}
        />
        {isWorkingMode ? (
          <RunDetailOverviewTransparencyTrail
            feasibilityVerdict={feasibilityVerdict}
            runCompleted={props.runCompleted}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="run-detail-review-package-stamp-viewport">
      <RunDetailReviewPackageClassificationSummary
        findings={props.quickDecisionFindings ?? []}
        withheldFindingCount={props.withheldFindingCount}
        catalogAdvisoryEngineFailureCount={props.catalogAdvisoryEngineFailureCount}
      />
      <RunDetailInsightDensityMeasurementDenominatorStrip
        suppressOnTerminalFailure={props.suppressMeasurementDenominator}
      />
      <RunDetailOverviewTransparencyTrail
        feasibilityVerdict={feasibilityVerdict}
        runCompleted={props.runCompleted}
      />
      <RunDetailSealDeskCoverageStrip
        runId={props.runId}
        analysisStagesComplete={props.analysisStagesComplete}
        graphSnapshot={props.graphSnapshot}
        transparencyTrail={props.transparencyTrail ?? null}
        className="mb-3"
      />
    </div>
  );
}
