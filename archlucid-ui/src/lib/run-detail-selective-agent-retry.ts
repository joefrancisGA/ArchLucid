/**
 * TB-938: choose agent types for selective re-execute from TB-937 outcome matrix.
 */

export type AgentExecutionOutcomeWire = {
  readonly agentType?: string | null;
  readonly outcome?: string | null;
};

/** Returns agent types that are not Succeeded (empty when none / nothing to retry). */
export function resolveFailedAgentTypesForSelectiveRetry(
  outcomes: readonly AgentExecutionOutcomeWire[] | null | undefined,
): string[] {
  const rows = outcomes ?? [];
  const failed: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const outcome = (row.outcome ?? "").trim();
    const agentType = (row.agentType ?? "").trim();

    if (agentType.length === 0) {
      continue;
    }

    if (outcome.length === 0 || outcome === "Succeeded") {
      continue;
    }

    if (seen.has(agentType)) {
      continue;
    }

    seen.add(agentType);
    failed.push(agentType);
  }

  return failed;
}
