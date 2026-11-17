import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";
import {
  GOVERNANCE_POLICY_PACKS_PATH,
  governancePolicyPackDetailPath,
} from "@/lib/governance/governance-route-paths";
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
    return ver.length === 0 ? `${id} · version not recorded` : id;
  }

  if (ver.length > 0) {
    return "Policy pack id was not stored.";
  }

  return "Policy pack not recorded";
}

/**
 * When the manifest references a pack we route with a sponsor narrative, return that governance detail path.
 */
export function policyPackBuyerGovernanceDetailHref(
  ruleSetId: string,
  hubPath: string = GOVERNANCE_POLICY_PACKS_PATH,
): string | null {
  const scenario = resolveSampleScenarioByPolicyPackId(ruleSetId);
  const detailHref = scenario?.policyPackDetailHref ?? (
    ruleSetId.trim() === "1" || ruleSetId.trim() === "ai-governance-responsible-ai-v1"
      ? governancePolicyPackDetailPath("1")
      : null
  );

  if (detailHref === null || hubPath === GOVERNANCE_POLICY_PACKS_PATH) {
    return detailHref;
  }

  return detailHref.replace(GOVERNANCE_POLICY_PACKS_PATH, hubPath);
}

export function policyPackBuyerDisplayNameFromId(policyPackId: string): string | null {
  const scenario = resolveSampleScenarioByPolicyPackId(policyPackId);

  if (scenario !== null) {
    return scenario.policyPackDisplayLabel;
  }

  const id = policyPackId.trim();

  if (id === "1" || id === "ai-governance-responsible-ai-v1") {
    return RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL;
  }

  return null;
}
