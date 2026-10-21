import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = owner.trim();

    if (trimmed.length === 0) {
      params.delete(ARCHITECTURES_HUB_OWNER_PARAM);
    } else {
      params.set(ARCHITECTURES_HUB_OWNER_PARAM, trimmed);
    }
    },
  });
}

export function architecturesHubDomainHrefFromSearch(
  currentSearch: string,
  domain: string,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = domain.trim();

    if (trimmed.length === 0) {
      params.delete(ARCHITECTURES_HUB_DOMAIN_PARAM);
    } else {
      params.set(ARCHITECTURES_HUB_DOMAIN_PARAM, trimmed);
    }
    },
  });
}
