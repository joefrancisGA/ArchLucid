import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const POLICY_PACKS_RESOLVED_CONTENT_OPEN_PARAM = "policyPacksResolvedContentOpen";

export function parsePolicyPacksResolvedContentOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPacksResolvedContentDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, POLICY_PACKS_RESOLVED_CONTENT_OPEN_PARAM);
}
