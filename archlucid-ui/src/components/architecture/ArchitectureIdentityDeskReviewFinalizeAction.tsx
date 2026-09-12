"use client";

import { CommitRunButton } from "@/components/CommitRunButton";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useFinalizeReadiness } from "@/hooks/use-finalize-readiness";
import { useReviewAssumptionAcknowledgements } from "@/hooks/use-review-assumption-acknowledgements";

type ArchitectureIdentityDeskReviewFinalizeActionProps = {
  readonly runId: string;
  readonly architectureId: string;
  readonly skipWhenInFlight: boolean;
};

/** SG-022 / AO-35 — Ready child jobs expose Finalize on the architecture desk job row. */
export function ArchitectureIdentityDeskReviewFinalizeAction(
  props: ArchitectureIdentityDeskReviewFinalizeActionProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { acknowledgedIds } = useReviewAssumptionAcknowledgements(props.runId);
  const finalizeEnabled = isWorkingMode && !props.skipWhenInFlight;
  const { readiness, loading } = useFinalizeReadiness({
    runId: props.runId,
    enabled: finalizeEnabled,
    acknowledgedAssumptionIds: acknowledgedIds,
  });

  if (!finalizeEnabled || loading || readiness === null || !readiness.readyToFinalize) {
    return null;
  }

  return (
    <CommitRunButton
      runId={props.runId}
      disabled={false}
      commitBlockedReason={readiness.blockedReasonSummary}
      commitBlockedBlocks={readiness.blocks}
      buttonVariant="outline"
      parentArchitectureId={props.architectureId}
    />
  );
}
