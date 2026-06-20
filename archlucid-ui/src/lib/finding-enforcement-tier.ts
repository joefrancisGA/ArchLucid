export type FindingEnforcementTierKind = "PolicyViolation" | "Advisory";

export function normalizeFindingEnforcementTier(raw: unknown): FindingEnforcementTierKind {
  if (typeof raw !== "string") {
    return "PolicyViolation";
  }

  const normalized = raw.trim();

  if (normalized.localeCompare("Advisory", undefined, { sensitivity: "accent" }) === 0) {
    return "Advisory";
  }

  return "PolicyViolation";
}

export function findingEnforcementTierLabel(tier: FindingEnforcementTierKind): string {
  return tier === "Advisory" ? "Advisory note" : "Policy violation";
}
