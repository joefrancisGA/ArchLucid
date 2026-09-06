import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";

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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SYSTEM_HEALTH_CLAIM_SCOPE_OPEN_PARAM);
  } else {
    params.set(SYSTEM_HEALTH_CLAIM_SCOPE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
