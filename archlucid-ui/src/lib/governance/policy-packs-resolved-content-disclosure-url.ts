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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(POLICY_PACKS_RESOLVED_CONTENT_OPEN_PARAM);
  } else {
    params.set(POLICY_PACKS_RESOLVED_CONTENT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
