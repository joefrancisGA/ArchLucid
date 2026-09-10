"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { useReviewDetailWorkspaceRoomElicitation } from "@/components/reviews/use-review-detail-workspace-room-elicitation";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

export type ReviewRoomHeaderButtonProps = {
  readonly runId: string;
  readonly reviewCompleted: boolean;
  readonly manifestVersion?: string | null;
};

/** Command-bar Room entry — starts elicitation without projector zoom (DR-16). */
export function ReviewRoomHeaderButton(props: ReviewRoomHeaderButtonProps): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const room = useReviewDetailWorkspaceRoomElicitation();
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestVersion ?? null,
  });

  if (!isWorkingMode || !props.reviewCompleted) {
    return null;
  }

  if (sealedManifestBlockedReason !== null) {
    return (
      <p
        role="alert"
        className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="review-room-blocked-reason"
      >
        {sealedManifestBlockedReason}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant={room.roomElicitationActive ? "default" : "outline"}
      size="sm"
      data-testid="review-room-enter"
      aria-pressed={room.roomElicitationActive}
      onClick={() => {
        if (room.roomElicitationActive) {
          room.exitRoomElicitation();
          return;
        }

        room.enterRoomElicitation();
      }}
    >
      {room.roomElicitationActive ? "Room on" : "Room"}
    </Button>
  );
}
