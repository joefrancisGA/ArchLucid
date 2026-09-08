"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { RunDetailCareerArtifactHonestyStrip } from "@/components/reviews/RunDetailCareerArtifactHonestyStrip";
import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";

import { RunDetailReviewPackageClassificationSummary } from "./RunDetailReviewPackageClassificationSummary";
import { RunDetailReviewPackageDecisionReceiptStrip } from "./RunDetailReviewPackageDecisionReceiptStrip";
import { RunDetailPreFinalizeGateHonestyStrip } from "@/components/reviews/RunDetailPreFinalizeGateHonestyStrip";
import { RunDetailQualityGateModeStrip } from "@/components/reviews/RunDetailQualityGateModeStrip";
import { RunDetailInsightDensityMeasurementDenominatorStrip } from "@/components/reviews/RunDetailInsightDensityMeasurementDenominatorStrip";
import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";
import type { HeldCheckLedgerRollupEntry } from "@/lib/findings/read-held-check-ledger-from-findings-snapshot";
import type { ManifestFeasibilityVerdict, TransparencyTrail } from "@/types/feasibility-verdict";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

export type RunDetailReviewPackageStampViewportProps = {
  readonly hasGoldenManifest: boolean;
  readonly runId: string;
  readonly suppressMeasurementDenominator?: boolean;
  readonly pipelineTerminalFailure?: boolean;
  readonly enginesSucceeded?: number | null;
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
  readonly analysisStagesComplete?: boolean;
  readonly graphSnapshot?: unknown;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly quickDecisionFindings?: readonly QuickDecisionFinding[];
  readonly withheldFindingCount?: number;
  readonly catalogAdvisoryEngineFailureCount?: number;
  readonly judgeSkippedByCap?: number | null;
  readonly heldCheckLedgerEntries?: readonly HeldCheckLedgerRollupEntry[];
  readonly structuralExecutionMode?: import("@/lib/structural-execution-mode").StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly preCommitGateEnabled?: boolean | null;
};

/** Receipt + transparency trail on the review-package stamp band (FD-05 / WA-13). */
export function RunDetailReviewPackageStampViewport(
  props: RunDetailReviewPackageStampViewportProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const feasibilityVerdict = props.feasibilityVerdict ?? null;
  const actorNodeCount = countActorNodesInGraphSnapshot(props.graphSnapshot);
  const pipelineTerminalFailure = props.pipelineTerminalFailure === true;
  const measurementFloorOptions = {
    actorNodeCount,
    analysisStagesComplete: props.analysisStagesComplete === true,
    judgeSkippedByCap: props.judgeSkippedByCap ?? null,
  };

  if (props.hasGoldenManifest) {
    if (feasibilityVerdict === null) {
      return null;
    }

    return (
      <div className="space-y-3" data-testid="run-detail-review-package-stamp-viewport">
        {!pipelineTerminalFailure ? (
          <>
            <RunDetailPreFinalizeGateHonestyStrip />
            <RunDetailQualityGateModeStrip
              runId={props.runId}
              structuralExecutionMode={props.structuralExecutionMode}
              isSample={props.isSample}
            />
          </>
        ) : null}
        <RunDetailCareerArtifactHonestyStrip
          artifactKind="finalize"
          runId={props.runId}
          progressSummary={null}
          manifestSummary={null}
          graphSnapshot={props.graphSnapshot}
          transparencyTrail={props.transparencyTrail ?? feasibilityVerdict?.transparencyTrail ?? null}
          enginesSucceeded={props.enginesSucceeded}
          workingDesk={isWorkingMode}
          judgeSkippedByCap={props.judgeSkippedByCap}
          catalogAdvisoryEngineFailureCount={props.catalogAdvisoryEngineFailureCount}
          preCommitGateEnabled={props.preCommitGateEnabled}
          structuralExecutionMode={props.structuralExecutionMode}
          isSample={props.isSample}
        />
        <RunDetailReviewPackageClassificationSummary
          findings={props.quickDecisionFindings ?? []}
          withheldFindingCount={props.withheldFindingCount}
          catalogAdvisoryEngineFailureCount={props.catalogAdvisoryEngineFailureCount}
        />
        <RunDetailInsightDensityMeasurementDenominatorStrip
          enginesSucceeded={props.enginesSucceeded}
          actorNodeCount={measurementFloorOptions.actorNodeCount}
          analysisStagesComplete={measurementFloorOptions.analysisStagesComplete}
          judgeSkippedByCap={measurementFloorOptions.judgeSkippedByCap}
          heldCheckLedgerEntries={props.heldCheckLedgerEntries}
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
            quickDecisionFindings={props.quickDecisionFindings}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="run-detail-review-package-stamp-viewport">
      {!pipelineTerminalFailure ? (
        <>
          <RunDetailPreFinalizeGateHonestyStrip />
          <RunDetailQualityGateModeStrip
            runId={props.runId}
            structuralExecutionMode={props.structuralExecutionMode}
            isSample={props.isSample}
          />
        </>
      ) : null}
      <RunDetailCareerArtifactHonestyStrip
        artifactKind="finalize"
        runId={props.runId}
        progressSummary={null}
        manifestSummary={null}
        graphSnapshot={props.graphSnapshot}
        transparencyTrail={props.transparencyTrail ?? feasibilityVerdict?.transparencyTrail ?? null}
        enginesSucceeded={props.enginesSucceeded}
        workingDesk={isWorkingMode}
        judgeSkippedByCap={props.judgeSkippedByCap}
        catalogAdvisoryEngineFailureCount={props.catalogAdvisoryEngineFailureCount}
        preCommitGateEnabled={props.preCommitGateEnabled}
        structuralExecutionMode={props.structuralExecutionMode}
        isSample={props.isSample}
      />
      <RunDetailReviewPackageClassificationSummary
        findings={props.quickDecisionFindings ?? []}
        withheldFindingCount={props.withheldFindingCount}
        catalogAdvisoryEngineFailureCount={props.catalogAdvisoryEngineFailureCount}
      />
      <RunDetailInsightDensityMeasurementDenominatorStrip
        actorNodeCount={measurementFloorOptions.actorNodeCount}
        analysisStagesComplete={measurementFloorOptions.analysisStagesComplete}
        judgeSkippedByCap={measurementFloorOptions.judgeSkippedByCap}
        heldCheckLedgerEntries={props.heldCheckLedgerEntries}
        suppressOnTerminalFailure={props.suppressMeasurementDenominator}
      />
      <RunDetailOverviewTransparencyTrail
        feasibilityVerdict={feasibilityVerdict}
        runCompleted={props.runCompleted}
        quickDecisionFindings={props.quickDecisionFindings}
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
