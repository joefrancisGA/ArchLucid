"use client";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorHomeSourcesOrientationStrip } from "@/components/operator-home/OperatorHomeSourcesOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: contextual follow-ups after at least one committed review exists. */
export function OperatorHomeBuyerChrome(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (!isBuyerPolishedOperatorShellEnv() || !hasCommittedArchitectureReview) {
    return null;
  }

  return <OperatorHomeSourcesOrientationStrip />;
}
