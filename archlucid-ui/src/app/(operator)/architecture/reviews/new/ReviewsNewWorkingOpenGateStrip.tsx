"use client";

import { OperatorHomeWorkingOpenGateLine } from "@/components/operator-home/OperatorHomeWorkingOpenGateLine";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

/** Buyer-polished reviews/new — browser-local open gate from the last review spine visit. */
export function ReviewsNewWorkingOpenGateStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return <OperatorHomeWorkingOpenGateLine workingMode={isWorkingMode} />;
}
