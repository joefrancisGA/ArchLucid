"use client";

import { useEffect, useState } from "react";

import { useAssumptionAwareCommitBlockedReason } from "@/hooks/use-assumption-aware-commit-blocked-reason";
import { usePriorSameRequestCompareHref } from "@/hooks/use-prior-same-request-compare-href";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ReviewPackageDoThisNextStrip } from "./ReviewPackageDoThisNextStrip";
import type {
  ResolveReviewPackageDoThisNextInput,
  ReviewPackageDoThisNext,
} from "./resolve-review-package-do-this-next";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type RunDetailReviewPackageDoThisNextResolvedProps = ResolveReviewPackageDoThisNextInput & {
  readonly hasGoldenManifest: boolean;
  readonly commitBlockedReason: string | null | undefined;
  readonly finalizeAssumptionGateApplies: boolean;
  readonly quickDecisionFindings: readonly QuickDecisionFinding[];
  readonly requestAssumptionTexts: readonly string[];
};

function doThisNextLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className={cn(
        "h-20 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label="Loading next step"
      data-testid="run-detail-do-this-next-resolved-loading"
    />
  );
}

/** Resolves review-package next-step copy off the page-view sync import graph (wave 14). */
export function RunDetailReviewPackageDoThisNextResolved(
  props: RunDetailReviewPackageDoThisNextResolvedProps,
): React.JSX.Element {
  const [next, setNext] = useState<ReviewPackageDoThisNext | null>(null);
  const priorCompare = usePriorSameRequestCompareHref(props.runId, 25);
  const assumptionAwareCommitBlockedReason = useAssumptionAwareCommitBlockedReason({
    runId: props.runId,
    serverCommitBlockedReason: props.commitBlockedReason,
    finalizeAssumptionGateApplies: props.finalizeAssumptionGateApplies,
    findings: props.quickDecisionFindings,
    blockingFindingCount: props.blockingFindingCount,
    requestAssumptionTexts: props.requestAssumptionTexts,
  });

  useEffect(() => {
    let canceled = false;

    void import("./resolve-review-package-do-this-next").then(({ resolveReviewPackageDoThisNext }) => {
      if (canceled) {
        return;
      }

      setNext(
        resolveReviewPackageDoThisNext({
          runId: props.runId,
          manifestId: props.manifestId,
          hasCommitBlockingFailures: props.hasCommitBlockingFailures,
          blockingFindingCount: props.blockingFindingCount,
          buyerPolishedArtifactTable: props.buyerPolishedArtifactTable,
          operatorGovernanceDecision: props.operatorGovernanceDecision,
          manifestStatus: props.manifestStatus,
          runCompleted: props.runCompleted,
          nextAction: props.nextAction,
          showProgressTracker: props.showProgressTracker,
          openClarificationGapCount: props.openClarificationGapCount,
          correctionHref: props.correctionHref,
          useCreateHomeWorkspaceTabs: props.useCreateHomeWorkspaceTabs,
          evidenceCoverageLinkedCount: props.evidenceCoverageLinkedCount,
          evidenceCoverageTotalCount: props.evidenceCoverageTotalCount,
          governanceDecisionRecorded: props.governanceDecisionRecorded,
          compareWithPriorHref: priorCompare.compareWithPriorHref,
        }),
      );
    });

    return () => {
      canceled = true;
    };
  }, [
    priorCompare.compareWithPriorHref,
    props.runId,
    props.manifestId,
    props.hasCommitBlockingFailures,
    props.blockingFindingCount,
    props.buyerPolishedArtifactTable,
    props.operatorGovernanceDecision,
    props.manifestStatus,
    props.runCompleted,
    props.nextAction,
    props.showProgressTracker,
    props.openClarificationGapCount,
    props.correctionHref,
    props.useCreateHomeWorkspaceTabs,
    props.evidenceCoverageLinkedCount,
    props.evidenceCoverageTotalCount,
    props.governanceDecisionRecorded,
  ]);

  if (next === null) {
    return doThisNextLoadingSkeleton();
  }

  return (
    <ReviewPackageDoThisNextStrip
      next={next}
      runId={props.runId}
      hasGoldenManifest={props.hasGoldenManifest}
      commitBlockedReason={assumptionAwareCommitBlockedReason}
    />
  );
}
