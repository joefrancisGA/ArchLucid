export type FindingEnforcementTierKind = "PolicyViolation" | "Advisory" | string | null;

export function normalizeFindingEnforcementTier(raw: unknown): FindingEnforcementTierKind {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw.trim();

  if (normalized.length === 0) {
    return null;
  }

  if (normalized.localeCompare("Advisory", undefined, { sensitivity: "accent" }) === 0) {
    return "Advisory";
  }

  if (normalized.localeCompare("PolicyViolation", undefined, { sensitivity: "accent" }) === 0) {
    return "PolicyViolation";
  }

  return normalized;
}

export function findingEnforcementTierLabel(tier: FindingEnforcementTierKind): string {
  if (tier === null) {
    return "Enforcement tier was not stored";
  }

  if (tier === "Advisory") {
    return "Advisory note";
  }

  if (tier === "PolicyViolation") {
    return "Policy violation";
  }

  if (tier.trim().toLowerCase() === "unknown") {
    return "Enforcement tier Unknown has no reviewer label.";
  }

  return tier;
}
