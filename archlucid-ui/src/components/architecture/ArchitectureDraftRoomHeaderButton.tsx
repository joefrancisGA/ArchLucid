"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  deriveRunDetailWorkspaceStatus,
  isReviewPipelineIncomplete,
} from "@/lib/run-detail-workspace-derive";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { reviewDetailRoomElicitationHref } from "@/lib/reviews/review-room-elicitation-url";
import { cn } from "@/lib/utils";

export type ArchitectureDraftRoomHeaderButtonProps = {
  readonly linkedReviewId: string | null;
};

/** Architecture draft desk Room entry — hands off to linked review elicitation (DR-16). */
export function ArchitectureDraftRoomHeaderButton(
  props: ArchitectureDraftRoomHeaderButtonProps,
): React.JSX.Element | null {
  const router = useRouter();
  const { isWorkingMode } = useWorkspaceMode();
  const linkedReviewId = props.linkedReviewId?.trim() ?? "";
  const runSummaryQuery = useRunSummaryQuery(linkedReviewId, {
    enabled: linkedReviewId.length > 0,
  });

  const reviewCompleted = useMemo(() => {
    if (runSummaryQuery.data === undefined) {
      return false;
    }

    const workspaceStatus = deriveRunDetailWorkspaceStatus({
      run: runSummaryQuery.data,
      manifestId: runSummaryQuery.data.goldenManifestId ?? runSummaryQuery.data.currentManifestVersion ?? null,
      manifestStatus: null,
      showProgressTracker: false,
      operatorGovernanceDecision: null,
      buyerPolishedArtifactTable: false,
    });

    return !isReviewPipelineIncomplete(workspaceStatus);
  }, [runSummaryQuery.data]);

  const manifestVersion =
    runSummaryQuery.data?.goldenManifestId?.trim()
    || runSummaryQuery.data?.currentManifestVersion?.trim()
    || null;

  const sealedManifestBlockedReason = linkedReviewId.length > 0
    ? runCollateralSealedManifestCopyBlockedReason({
        runId: linkedReviewId,
        manifestVersion,
      })
    : null;

  if (!isWorkingMode || linkedReviewId.length === 0 || !reviewCompleted) {
    return null;
  }

  if (sealedManifestBlockedReason !== null) {
    return (
      <p
        role="alert"
        className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-draft-room-blocked-reason"
      >
        {sealedManifestBlockedReason}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="review-room-enter"
      onClick={() => {
        router.push(reviewDetailRoomElicitationHref(linkedReviewId));
      }}
    >
      Room
    </Button>
  );
}
