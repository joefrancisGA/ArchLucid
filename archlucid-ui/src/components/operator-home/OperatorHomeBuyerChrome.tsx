"use client";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OperatorHomeEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-operator-strips";
import { OPERATOR_HOME_ORIENTATION_SOURCES } from "@/lib/operator/operator-home-evidence-copy";

/** Buyer default: contextual follow-ups after at least one committed review exists. */
export function OperatorHomeBuyerChrome(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (!isBuyerPolishedOperatorShellEnv() || !hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <div data-testid="operator-home-orientation-top">
      <OperatorHomeEvidenceOrientationStrip sources={OPERATOR_HOME_ORIENTATION_SOURCES} />
    </div>
  );
}
