import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_FINDINGS_OWNER_FILTER_PARAM = "owner";
export const REVIEW_FINDINGS_DOMAIN_FILTER_PARAM = "domain";

export function parseReviewFindingsOwnerFilterFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseReviewFindingsDomainFilterFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function reviewFindingsOwnerFilterHrefFromSearch(
  currentSearch: string,
  pathname: string,
  owner: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = owner.trim();

    if (trimmed.length === 0) {
      params.delete(REVIEW_FINDINGS_OWNER_FILTER_PARAM);
    } else {
      params.set(REVIEW_FINDINGS_OWNER_FILTER_PARAM, trimmed);
    }
    },
  });
}

export function reviewFindingsDomainFilterHrefFromSearch(
  currentSearch: string,
  pathname: string,
  domain: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = domain.trim();

    if (trimmed.length === 0) {
      params.delete(REVIEW_FINDINGS_DOMAIN_FILTER_PARAM);
    } else {
      params.set(REVIEW_FINDINGS_DOMAIN_FILTER_PARAM, trimmed);
    }
    },
  });
}

export function reviewFindingsToolbarClearOwnerHrefFromSearch(
  currentSearch: string,
  pathname: string,
): string {
  return reviewFindingsOwnerFilterHrefFromSearch(currentSearch, pathname, "");
}

export function reviewFindingsToolbarClearDomainHrefFromSearch(
  currentSearch: string,
  pathname: string,
): string {
  return reviewFindingsDomainFilterHrefFromSearch(currentSearch, pathname, "");
}
