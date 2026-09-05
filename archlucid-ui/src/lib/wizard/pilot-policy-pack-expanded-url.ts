export const PILOT_POLICY_PACK_EXPANDED_PARAM = "pilotPolicyPackExpanded";

export function parsePilotPolicyPackExpandedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pilotPolicyPackExpandedHrefFromSearch(
  currentSearch: string,
  expanded: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!expanded) {
    params.delete(PILOT_POLICY_PACK_EXPANDED_PARAM);
  } else {
    params.set(PILOT_POLICY_PACK_EXPANDED_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
