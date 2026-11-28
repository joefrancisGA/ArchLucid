"use client";

import { SecureNowCuttingEdgeSubstrateStrip } from "@/components/product-line/SecureNowCuttingEdgeSubstrateStrip";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { resolveSecureNowCuttingEdgeSubstrate } from "@/lib/product-line/resolve-securenow-cutting-edge-substrate";

export type SecureNowCuttingEdgeSubstrateAutoProps = {
  readonly testId: string;
  readonly enabled?: boolean;
};

export function SecureNowCuttingEdgeSubstrateAuto(
  props: SecureNowCuttingEdgeSubstrateAutoProps,
): React.JSX.Element | null {
  const enabled = props.enabled !== false;
  const executionMode = useAgentExecutionMode();

  if (!enabled || executionMode.isLoading) {
    return null;
  }

  const substrate = resolveSecureNowCuttingEdgeSubstrate(executionMode.mode);

  if (substrate === null) {
    return null;
  }

  return <SecureNowCuttingEdgeSubstrateStrip testId={props.testId} substrate={substrate} />;
}
