export type FindingEnforcementTierKind = "PolicyViolation" | "Advisory" | null;

export function normalizeFindingEnforcementTier(raw: unknown): FindingEnforcementTierKind {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.trim();

  if (normalized.localeCompare("Advisory", undefined, { sensitivity: "accent" }) === 0) {
    return "Advisory";
  }

  if (normalized.localeCompare("PolicyViolation", undefined, { sensitivity: "accent" }) === 0) {
    return "PolicyViolation";
  }

  return null;
}

export function findingEnforcementTierLabel(tier: FindingEnforcementTierKind): string {
  if (tier === null) {
    return "Enforcement tier was not stored";
  }

  return tier === "Advisory" ? "Advisory note" : "Policy violation";
}
