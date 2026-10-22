import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const SYSTEM_HEALTH_CLAIM_SCOPE_OPEN_PARAM = "systemHealthClaimScopeOpen";

export function parseSystemHealthClaimScopeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function systemHealthClaimScopeHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = ADMINISTRATION_SYSTEM_HEALTH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(SYSTEM_HEALTH_CLAIM_SCOPE_OPEN_PARAM);
    } else {
      params.set(SYSTEM_HEALTH_CLAIM_SCOPE_OPEN_PARAM, "1");
    }
    },
  });
}
