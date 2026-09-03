import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";

export const ARCHITECTURES_HUB_OWNER_PARAM = "owner";
export const ARCHITECTURES_HUB_DOMAIN_PARAM = "domain";

export function parseArchitecturesHubOwnerFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseArchitecturesHubDomainFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function architecturesHubOwnerHrefFromSearch(
  currentSearch: string,
  owner: string,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = owner.trim();

  if (trimmed.length === 0) {
    params.delete(ARCHITECTURES_HUB_OWNER_PARAM);
  } else {
    params.set(ARCHITECTURES_HUB_OWNER_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function architecturesHubDomainHrefFromSearch(
  currentSearch: string,
  domain: string,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = domain.trim();

  if (trimmed.length === 0) {
    params.delete(ARCHITECTURES_HUB_DOMAIN_PARAM);
  } else {
    params.set(ARCHITECTURES_HUB_DOMAIN_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
