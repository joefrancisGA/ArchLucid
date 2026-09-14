"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { useReviewDetailWorkspaceRoomElicitation } from "@/components/reviews/use-review-detail-workspace-room-elicitation";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { resolveWorkingRoomElicitationHref } from "@/lib/reviews/review-room-elicitation-url";

export type ReviewRoomHeaderButtonProps = {
  readonly runId: string;
  readonly reviewCompleted: boolean;
  readonly manifestVersion?: string | null;
  readonly parentArchitectureId?: string | null;
};

/** Command-bar Room entry — starts elicitation without projector zoom (DR-16). */
export function ReviewRoomHeaderButton(props: ReviewRoomHeaderButtonProps): React.JSX.Element | null {
  const router = useRouter();
  const { isWorkingMode } = useWorkspaceMode();
  const room = useReviewDetailWorkspaceRoomElicitation();
  const parentArchitectureId = props.parentArchitectureId?.trim() ?? "";
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
      variant={parentArchitectureId.length > 0 || !room.roomElicitationActive ? "outline" : "default"}
      size="sm"
      data-testid="review-room-enter"
      aria-pressed={parentArchitectureId.length === 0 ? room.roomElicitationActive : undefined}
      onClick={() => {
        if (parentArchitectureId.length > 0) {
          router.push(
            resolveWorkingRoomElicitationHref({
              architectureId: parentArchitectureId,
              runId: props.runId,
            }),
          );

          return;
        }

        if (room.roomElicitationActive) {
          room.exitRoomElicitation();
          return;
        }

        room.enterRoomElicitation();
      }}
    >
      {parentArchitectureId.length === 0 && room.roomElicitationActive ? "Room on" : "Room"}
    </Button>
  );
}
