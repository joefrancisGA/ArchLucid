"use client";

import { useCallback } from "react";

import { OperatorHomeCanonicalNextActionSlot } from "@/components/operator-home/OperatorHomeCanonicalNextActionSlot";
import { useOperatorHomeEmptyDoThisNextAction } from "@/hooks/use-operator-home-empty-do-this-next-action";
import { beginLiveSeatTrainingWalkthroughFromHome } from "@/lib/auth/live-seat-training-walkthrough-from-home";
import { toOperatorCanonicalNextActionFromEmptyHome } from "@/lib/operator-canonical-next-action";

/** Empty Overview — delegates to the canonical next-action slot (TB-2232). */
export function OperatorHomeDoThisNextCard(): React.JSX.Element {
  const { action, sampleLoading } = useOperatorHomeEmptyDoThisNextAction();
  const secondary = action.secondary;
  const onTrainingWalkthrough = useCallback(() => {
    void beginLiveSeatTrainingWalkthroughFromHome();
  }, []);

  return (
    <OperatorHomeCanonicalNextActionSlot
      clientFallback={toOperatorCanonicalNextActionFromEmptyHome(action)}
      sampleLoading={sampleLoading}
      slotTestId="operator-home-do-this-next"
      bridgeTestId="operator-home-do-this-next-bridge"
      primaryTestId="operator-home-do-this-next-primary"
      secondaryTestId={
        secondary?.kind === "training-walkthrough" ? "operator-home-do-this-next-secondary" : undefined
      }
      secondaryLabel={secondary?.label}
      onSecondaryAction={secondary?.kind === "training-walkthrough" ? onTrainingWalkthrough : undefined}
    />
  );
}
