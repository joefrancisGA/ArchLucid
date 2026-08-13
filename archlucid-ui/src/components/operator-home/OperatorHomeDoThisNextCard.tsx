"use client";

import { OperatorHomeCanonicalNextActionSlot } from "@/components/operator-home/OperatorHomeCanonicalNextActionSlot";
import { useOperatorHomeEmptyDoThisNextAction } from "@/hooks/use-operator-home-empty-do-this-next-action";
import { toOperatorCanonicalNextActionFromEmptyHome } from "@/lib/operator-canonical-next-action";

/** Empty Overview — delegates to the canonical next-action slot (TB-2232). */
export function OperatorHomeDoThisNextCard(): React.JSX.Element {
  const { action, sampleLoading } = useOperatorHomeEmptyDoThisNextAction();

  return (
    <OperatorHomeCanonicalNextActionSlot
      clientFallback={toOperatorCanonicalNextActionFromEmptyHome(action)}
      sampleLoading={sampleLoading}
      slotTestId="operator-home-do-this-next"
      bridgeTestId="operator-home-do-this-next-bridge"
      primaryTestId="operator-home-do-this-next-primary"
    />
  );
}
