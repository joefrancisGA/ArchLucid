"use client";

import { OperatorHomeEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-operator-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_HOME_ORIENTATION_SOURCES } from "@/lib/operator/operator-home-evidence-copy";

/** Buyer default: mount Sources orientation above the overview hero (HOM). */
export function OperatorHomeBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="operator-home-orientation-top">
      <OperatorHomeEvidenceOrientationStrip sources={OPERATOR_HOME_ORIENTATION_SOURCES} />
    </div>
  );
}
