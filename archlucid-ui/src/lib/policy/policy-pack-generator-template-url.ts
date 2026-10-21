import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { applyOperatorUrlSelectionSwitch } from "@/lib/operator/operator-url-selection-switch";

export const POLICY_PACK_GENERATOR_TEMPLATE_PARAM = "generatorTemplate";

export function parsePolicyPackGeneratorTemplateFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function policyPackGeneratorTemplateHrefFromSearch(
  currentSearch: string,
  templateId: string,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = templateId.trim();

  applyOperatorUrlSelectionSwitch(params, { kind: "policy-pack-generator-template" });

  if (trimmed.length === 0) {
    params.delete(POLICY_PACK_GENERATOR_TEMPLATE_PARAM);
  } else {
    params.set(POLICY_PACK_GENERATOR_TEMPLATE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
