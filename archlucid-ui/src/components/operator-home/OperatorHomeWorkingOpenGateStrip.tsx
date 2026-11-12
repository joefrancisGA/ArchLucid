"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

import { OperatorHomeWorkingOpenGateLine } from "./OperatorHomeWorkingOpenGateLine";

/** Shared buyer-polished shell strip for the browser-local review gate. */
export function OperatorHomeWorkingOpenGateStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return <OperatorHomeWorkingOpenGateLine workingMode={isWorkingMode} />;
}
