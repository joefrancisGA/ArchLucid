"use client";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { resolveOperatorHomeWorkspaceReadiness } from "@/lib/operator/operator-home-workspace-readiness";

type OperatorHomeContinueSetupSlotProps = {
  readonly placement: "prominent" | "hidden";
};

/**
 * Renders setup blockers on Overview for first-run tenants only.
 * While readiness is still loading the context is null, so the optimistic default keeps the slot
 * silent rather than announcing an unverified ready state.
 */
export function OperatorHomeContinueSetupSlot(props: OperatorHomeContinueSetupSlotProps): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const readiness = useFinishSetupReadinessContext();

  if (props.placement !== "prominent" || hasCommittedArchitectureReview) {
    return null;
  }

  const workspaceReadiness =
    readiness.context !== null
      ? resolveOperatorHomeWorkspaceReadiness(readiness.context)
      : { canBegin: true, blockerMessage: null };

  return (
    <OperatorHomeContinueSetupCard
      canBegin={workspaceReadiness.canBegin}
      blockerMessage={workspaceReadiness.blockerMessage}
    />
  );
}
