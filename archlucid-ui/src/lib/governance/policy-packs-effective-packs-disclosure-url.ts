import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const POLICY_PACKS_EFFECTIVE_PACKS_OPEN_PARAM = "policyPacksEffectivePacksOpen";

export function parsePolicyPacksEffectivePacksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPacksEffectivePacksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, POLICY_PACKS_EFFECTIVE_PACKS_OPEN_PARAM);
}
