"use client";

import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { areFinishSetupRequiredStepsComplete } from "@/lib/finish-setup-wizard-steps";
import {
  resolveOperatorHomeContinueSetupPlacement,
  type OperatorHomeContinueSetupPlacement,
} from "@/lib/resolve-operator-home-continue-setup-placement";

type OperatorHomeContinueSetupSlotProps = {
  readonly placement: OperatorHomeContinueSetupPlacement;
};

/** Renders Continue setup on Overview only when placement matches setup readiness. */
export function OperatorHomeContinueSetupSlot(props: OperatorHomeContinueSetupSlotProps): React.JSX.Element | null {
  const readiness = useFinishSetupReadinessContext();
  const requiredStepsComplete =
    readiness.context !== null ? areFinishSetupRequiredStepsComplete(readiness.context) : false;
  const resolvedPlacement = resolveOperatorHomeContinueSetupPlacement({
    phase: readiness.phase,
    readyCount: readiness.readyCount,
    totalCount: readiness.totalCount,
    requiredStepsComplete,
  });

  if (resolvedPlacement !== props.placement) {
    return null;
  }

  return (
    <OperatorHomeContinueSetupCard
      readyCount={readiness.readyCount}
      totalCount={readiness.totalCount}
      loading={readiness.phase === "loading"}
    />
  );
}
