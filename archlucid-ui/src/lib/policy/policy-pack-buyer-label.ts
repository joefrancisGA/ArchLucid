import { SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF } from "@/lib/showcase-static-demo";
import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";

/**
 * Buyer-facing policy pack line for healthcare claims demo and generic rule-set ids.
 */
export function policyPackBuyerLabel(ruleSetId: string, ruleSetVersion: string): string {
  const id = ruleSetId.trim();
  const ver = ruleSetVersion.trim();

  if (id === "enterprise-privacy-v2" || id === "healthcare-claims-v3") {
    return ver.length > 0 ? `Enterprise Privacy Policy Pack v${ver}` : "Enterprise Privacy Policy Pack";
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

  if (id === "enterprise-privacy-v2" || id === "healthcare-claims-v3") {
    return SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF;
  }

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
