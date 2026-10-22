import {
  isDevTestingOverridesEnabled,
  resolveEffectiveDevAgentExecutionMode,
  type DevAgentExecutionModeOverride,
} from "@/lib/dev-testing-overrides";

/** Wire values from `GET /health/ready` `agentExecutionMode` and dev quick-switch overrides. */
export type AgentExecutionModeWire = "Simulator" | "Real";

export function parseAgentExecutionModeWire(
  raw: string | null | undefined,
): AgentExecutionModeWire | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.localeCompare("Simulator", undefined, { sensitivity: "accent" }) === 0) {
    return "Simulator";
  }

  if (
    trimmed.localeCompare("Real", undefined, { sensitivity: "accent" }) === 0
    || trimmed.localeCompare("Live", undefined, { sensitivity: "accent" }) === 0
  ) {
    return "Real";
  }

  return null;
}

export function isSimulatorAgentExecutionMode(mode: AgentExecutionModeWire | null): boolean {
  return mode === "Simulator";
}

/**
 * Resolves the agent execution mode that AI calls will use for this browser session.
 * In local dev, the dev quick-switch cookie wins (mirrors the proxy upstream header).
 * Otherwise, use the host configuration surfaced on `GET /health/ready`.
 */
export function resolveClientAgentExecutionMode(input: {
  readonly healthAgentExecutionMode?: string | null;
  readonly devOverride?: DevAgentExecutionModeOverride | null;
}): AgentExecutionModeWire | null {
  if (isDevTestingOverridesEnabled()) {
    if (input.devOverride !== null && input.devOverride !== undefined) {
      return input.devOverride;
    }

    const fromHealth = parseAgentExecutionModeWire(input.healthAgentExecutionMode);

    if (fromHealth !== null) {
      return fromHealth;
    }

    return resolveEffectiveDevAgentExecutionMode(null);
  }

  return parseAgentExecutionModeWire(input.healthAgentExecutionMode);
}
