import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const POLICY_PACK_PUBLISH_CONFIRM_PARAM = "publishConfirm";

export function parsePolicyPackPublishConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPackPublishConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!confirmOpen) {
      params.delete(POLICY_PACK_PUBLISH_CONFIRM_PARAM);
    } else {
      params.set(POLICY_PACK_PUBLISH_CONFIRM_PARAM, "1");
    }
    },
  });
}
