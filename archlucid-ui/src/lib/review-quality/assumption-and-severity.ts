export type UnverifiedAssumption = {
  readonly id: string;
  readonly text: string;
  readonly existential: boolean;
};

const EXISTENTIAL_TOKENS = [
  "data class",
  "rto",
  "rpo",
  "trust boundary",
  "recovery",
  "pii",
  "phi",
  "regulated",
] as const;

/** TB-2314: unverified assumptions become confirm / replace / caveat work. */
export function parseUnverifiedAssumptions(assumptions: readonly string[]): readonly UnverifiedAssumption[] {
  const results: UnverifiedAssumption[] = [];

  for (let index = 0; index < assumptions.length; index += 1) {
    const text = assumptions[index]?.trim() ?? "";

    if (text.length === 0) {
      continue;
    }

    const lower = text.toLowerCase();
    const existential = EXISTENTIAL_TOKENS.some((token) => lower.includes(token));

    results.push({
      id: `assumption-${index + 1}`,
      text,
      existential,
    });
  }

  return results;
}

export function countExistentialUnverifiedAssumptions(assumptions: readonly UnverifiedAssumption[]): number {
  return assumptions.filter((assumption) => assumption.existential).length;
}

export type StatedConstraintContext = {
  readonly rtoMinutes: number | null;
  readonly rpoMinutes: number | null;
  readonly monthlyCostCeilingUsd: number | null;
};

/** TB-2319: severity labels reference stated constraints when the finding text mentions them. */
export function buildSeverityConstraintNote(
  findingText: string,
  constraints: StatedConstraintContext,
): string | null {
  const lower = findingText.toLowerCase();

  if (lower.includes("rto") && constraints.rtoMinutes !== null) {
    return `Stated RTO: ${constraints.rtoMinutes} minutes — calibrate severity against this target, not a generic outage SLA.`;
  }

  if (lower.includes("rpo") && constraints.rpoMinutes !== null) {
    return `Stated RPO: ${constraints.rpoMinutes} minutes — calibrate severity against this target.`;
  }

  if (
    (lower.includes("cost") || lower.includes("budget"))
    && constraints.monthlyCostCeilingUsd !== null
  ) {
    return `Stated monthly cost ceiling: $${constraints.monthlyCostCeilingUsd} — calibrate cost findings against this ceiling.`;
  }

  return null;
}
