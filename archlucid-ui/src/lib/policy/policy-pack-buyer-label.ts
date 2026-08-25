import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { resolveSampleScenarioByPolicyPackId } from "@/lib/samples/registry";

/**
 * Buyer-facing policy pack line for registered sample rule-set ids and generic rule-set ids.
 */
export function policyPackBuyerLabel(ruleSetId: string, ruleSetVersion: string): string {
  const scenario = resolveSampleScenarioByPolicyPackId(ruleSetId);
  const ver = ruleSetVersion.trim();

  if (scenario !== null && ver.length > 0) {
    return `${scenario.policyPackDisplayLabel} v${ver}`;
  }

  const id = ruleSetId.trim();

  if (id.length > 0 && ver.length > 0) {
    return `${id} v${ver}`;
  }

  if (id.length > 0) {
    return id;
  }

  return " — ";
}

/**
 * When the manifest references a pack we route with a sponsor narrative, return that governance detail path.
 */
export function policyPackBuyerGovernanceDetailHref(ruleSetId: string): string | null {
  const scenario = resolveSampleScenarioByPolicyPackId(ruleSetId);

  if (scenario !== null) {
    return scenario.policyPackDetailHref;
  }

  const id = ruleSetId.trim();

  if (id === "1" || id === "ai-governance-responsible-ai-v1") {
    return governancePolicyPackDetailPath("1");
  }

  return null;
}

export function policyPackBuyerDisplayNameFromId(policyPackId: string): string | null {
  const id = policyPackId.trim();

  if (id === "1" || id.includes("responsible-ai") || id.includes("ai-governance")) {
    return RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL;
  }

  return null;
}
