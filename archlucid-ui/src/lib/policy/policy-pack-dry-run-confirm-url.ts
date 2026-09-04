import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACK_DRY_RUN_CONFIRM_PARAM = "dryRunOpen";

export function parsePolicyPackDryRunConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPackDryRunConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(POLICY_PACK_DRY_RUN_CONFIRM_PARAM);
  } else {
    params.set(POLICY_PACK_DRY_RUN_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
