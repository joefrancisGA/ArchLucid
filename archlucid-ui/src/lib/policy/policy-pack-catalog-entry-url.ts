import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACK_CATALOG_ENTRY_PARAM = "catalogEntry";

export function parsePolicyPackCatalogEntryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function policyPackCatalogEntryHrefFromSearch(
  currentSearch: string,
  catalogEntryId: string,
  pathname: string = GOVERNANCE_POLICY_PACKS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = catalogEntryId.trim();

  if (trimmed.length === 0) {
    params.delete(POLICY_PACK_CATALOG_ENTRY_PARAM);
  } else {
    params.set(POLICY_PACK_CATALOG_ENTRY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
