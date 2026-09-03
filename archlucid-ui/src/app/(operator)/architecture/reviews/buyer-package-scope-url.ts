import type { BuyerPackageScopeFilter } from "./runs-list-types";

export const BUYER_PACKAGE_SCOPE_PARAM = "scope";

const BUYER_PACKAGE_SCOPE_IDS = new Set<string>(["all", "finalized", "in_flight"]);

export function parseBuyerPackageScopeFilter(raw: string | null | undefined): BuyerPackageScopeFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!BUYER_PACKAGE_SCOPE_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as BuyerPackageScopeFilter;
}

export function buyerPackageScopeHrefFromSearch(
  currentSearch: string,
  scope: BuyerPackageScopeFilter,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (scope === "all") {
    params.delete(BUYER_PACKAGE_SCOPE_PARAM);
  } else {
    params.set(BUYER_PACKAGE_SCOPE_PARAM, scope);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
