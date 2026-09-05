"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";

import { RunDetailReviewPackageDecisionReceiptStrip } from "./RunDetailReviewPackageDecisionReceiptStrip";
import type { ManifestFeasibilityVerdict, TransparencyTrail } from "@/types/feasibility-verdict";

export type RunDetailReviewPackageStampViewportProps = {
  readonly hasGoldenManifest: boolean;
  readonly runId: string;
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
  readonly analysisStagesComplete?: boolean;
  readonly graphSnapshot?: unknown;
  readonly transparencyTrail?: TransparencyTrail | null;
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
