import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "governance-findings-queue-navigation" },
    mutate: (params) => {

    if (!hideGeneric) {
      params.delete(GOVERNANCE_FINDINGS_HIDE_GENERIC_PARAM);
    } else {
      params.set(GOVERNANCE_FINDINGS_HIDE_GENERIC_PARAM, "1");
    }
    },
  });
}
