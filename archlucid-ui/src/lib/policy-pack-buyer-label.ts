/**
 * Buyer-facing policy pack line for healthcare claims demo and generic rule-set ids.
 */
export function policyPackBuyerLabel(ruleSetId: string, ruleSetVersion: string): string {
  const id = ruleSetId.trim();
  const ver = ruleSetVersion.trim();

  if (id === "healthcare-claims-v3" && ver.length > 0) {
    return `Healthcare Claims Policy Pack v${ver}`;
  }

  if (id.length > 0 && ver.length > 0) {
    return `${id} v${ver}`;
  }

  if (id.length > 0) {
    return id;
  }

  return "—";
}

/**
 * When the manifest references a pack we route with a sponsor narrative, return that governance detail path.
 */
export function policyPackBuyerGovernanceDetailHref(ruleSetId: string): string | null {
  const id = ruleSetId.trim();

  if (id === "healthcare-claims-v3") {
    return "/governance/policy-packs/healthcare-claims-v3-pack";
  }

  return null;
}
