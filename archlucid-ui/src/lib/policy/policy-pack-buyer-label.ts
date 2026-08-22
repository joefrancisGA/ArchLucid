import { CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF } from "@/lib/samples/claims-intake/definition";
import { CUSTOMER_INTAKE_POLICY_PACK_DETAIL_HREF } from "@/lib/samples/customer-intake-modernization/definition";
import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";

/**
 * Buyer-facing policy pack line for healthcare claims demo and generic rule-set ids.
 */
export function policyPackBuyerLabel(ruleSetId: string, ruleSetVersion: string): string {
  const id = ruleSetId.trim();
  const ver = ruleSetVersion.trim();

  if (id === "healthcare-claims-v3" && ver.length > 0) {
    return `Healthcare Claims Policy Pack v${ver}`;
  }

  if (id === "enterprise-privacy-v2" && ver.length > 0) {
    return `Enterprise Privacy Policy Pack v${ver}`;
  }

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
  const id = ruleSetId.trim();

  if (id === "healthcare-claims-v3") {
    return CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF;
  }

  if (id === "enterprise-privacy-v2") {
    return CUSTOMER_INTAKE_POLICY_PACK_DETAIL_HREF;
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
