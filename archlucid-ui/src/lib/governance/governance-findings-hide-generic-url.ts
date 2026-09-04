import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_FINDINGS_HIDE_GENERIC_PARAM = "hideGeneric";

export function parseGovernanceFindingsHideGenericFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceFindingsHideGenericHrefFromSearch(
  currentSearch: string,
  hideGeneric: boolean,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!hideGeneric) {
    params.delete(GOVERNANCE_FINDINGS_HIDE_GENERIC_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_HIDE_GENERIC_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
