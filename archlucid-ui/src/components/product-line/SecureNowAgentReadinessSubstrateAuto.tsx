"use client";

import { SecureNowAgentReadinessSubstrateStrip } from "@/components/product-line/SecureNowAgentReadinessSubstrateStrip";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { resolveSecureNowAgentReadinessSubstrate } from "@/lib/product-line/resolve-securenow-agent-readiness-substrate";

export type SecureNowAgentReadinessSubstrateAutoProps = {
  readonly testId: string;
  readonly enabled?: boolean;
};

export function SecureNowAgentReadinessSubstrateAuto(
  props: SecureNowAgentReadinessSubstrateAutoProps,
): React.JSX.Element | null {
  const enabled = props.enabled !== false;
  const executionMode = useAgentExecutionMode();

  if (!enabled || executionMode.isLoading) {
    return null;
  }

  const substrate = resolveSecureNowAgentReadinessSubstrate(executionMode.mode);

  if (substrate === null) {
    return null;
  }

  return <SecureNowAgentReadinessSubstrateStrip testId={props.testId} substrate={substrate} />;
}
