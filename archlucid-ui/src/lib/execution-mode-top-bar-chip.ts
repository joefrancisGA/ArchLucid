import {
  parseAgentExecutionModeWire,
  type AgentExecutionModeWire,
} from "@/lib/agent-execution-mode";
import {
  isDevTestingOverridesEnabled,
  persistDevAgentExecutionModeOverride,
  readDevAgentExecutionModeOverrideFromDocument,
  reloadAfterDevTestingOverrideChange,
  type DevAgentExecutionModeOverride,
} from "@/lib/dev-testing-overrides";

/** Whether the execution-mode top-bar chip should render for this session. */
export function shouldShowExecutionModeTopBarChip(input: {
  readonly isLoading: boolean;
  readonly hostAgentExecutionMode?: string | null;
  readonly devOverride?: DevAgentExecutionModeOverride | null;
}): boolean {
  if (input.isLoading) {
    return false;
  }

  const hostMode = parseAgentExecutionModeWire(input.hostAgentExecutionMode);
  const devOverride = input.devOverride ?? readDevAgentExecutionModeOverrideFromDocument();
  const hostIsSimulator = hostMode === "Simulator";
  const hasDevOverride = devOverride !== null;

  return hostIsSimulator || hasDevOverride;
}

/** Persists the opposite execution mode and reloads so API + UI pick up the change. */
export function toggleDevAgentExecutionModeFromChip(currentMode: AgentExecutionModeWire): void {
  if (!isDevTestingOverridesEnabled()) {
    return;
  }

  const nextMode: DevAgentExecutionModeOverride = currentMode === "Simulator" ? "Real" : "Simulator";

  persistDevAgentExecutionModeOverride(nextMode);
  reloadAfterDevTestingOverrideChange();
}
