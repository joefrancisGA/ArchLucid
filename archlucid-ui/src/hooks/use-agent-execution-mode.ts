"use client";

import { useEffect, useMemo, useState } from "react";

import {
  isSimulatorAgentExecutionMode,
  resolveClientAgentExecutionMode,
  type AgentExecutionModeWire,
} from "@/lib/agent-execution-mode";
import {
  isDevTestingOverridesEnabled,
  readDevAgentExecutionModeOverrideFromDocument,
  resolveDevUiAgentExecutionMode,
  type DevAgentExecutionModeOverride,
} from "@/lib/dev-testing-overrides";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";

export type AgentExecutionModeState = {
  readonly mode: AgentExecutionModeWire | null;
  readonly isSimulator: boolean;
  readonly isLoading: boolean;
};

/** Effective AgentExecution mode for this browser session (health config or dev quick-switch). */
export function useAgentExecutionMode(): AgentExecutionModeState {
  const healthQuery = useHealthReadySummaryQuery();
  const [devOverride, setDevOverride] = useState<DevAgentExecutionModeOverride | null>(null);

  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      return;
    }

    setDevOverride(readDevAgentExecutionModeOverrideFromDocument());
  }, []);

  const mode = useMemo(
    () => {
      const fromHealth = resolveClientAgentExecutionMode({
        healthAgentExecutionMode: healthQuery.data?.agentExecutionMode,
        devOverride: null,
      });

      if (!isDevTestingOverridesEnabled()) {
        return fromHealth;
      }

      return resolveDevUiAgentExecutionMode(devOverride, healthQuery.data?.agentExecutionMode) ?? fromHealth;
    },
    [devOverride, healthQuery.data?.agentExecutionMode],
  );

  const isLoading =
    mode === null
    && !isDevTestingOverridesEnabled()
    && healthQuery.isPending;

  return {
    mode,
    isSimulator: isSimulatorAgentExecutionMode(mode),
    isLoading,
  };
}
