"use client";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { resolveOperatorHomeWorkspaceReadiness } from "@/lib/operator-home-workspace-readiness";

type OperatorHomeContinueSetupSlotProps = {
  readonly placement: "prominent" | "hidden";
};

/** Renders workspace readiness on Overview for first-run tenants only. */
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
      loading={readiness.phase === "loading"}
      canBegin={workspaceReadiness.canBegin}
      blockerMessage={workspaceReadiness.blockerMessage}
    />
  );
}
