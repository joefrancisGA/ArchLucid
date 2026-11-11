"use client";

import { OperatorHomeWorkingOpenGateLine } from "@/components/operator-home/OperatorHomeWorkingOpenGateLine";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

/** Buyer-polished architecture scorecard — browser-local open gate from the last review spine visit. */
export function ScorecardWorkingOpenGateStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return <OperatorHomeWorkingOpenGateLine workingMode={isWorkingMode} />;
}
