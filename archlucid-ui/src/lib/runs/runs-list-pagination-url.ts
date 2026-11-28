import { REVIEWS_HUB_MAX_PAGE_SIZE } from "@/lib/inventory-showing-count";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

function runsListPaginationProjectIdFromParams(params: URLSearchParams, fallbackProjectId: string): string {
  const fromSearch = params.get("projectId");

  if (fromSearch !== null && fromSearch.trim().length > 0) {
    return fromSearch.trim();
  }

  return fallbackProjectId;
}

export function runsListPaginationPageFromParams(params: URLSearchParams, fallbackPage: number): number {
  const fromSearch = params.get("page");

  if (fromSearch === null) {
    return fallbackPage;
  }

  const parsed = Number.parseInt(fromSearch, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackPage;
  }

  return parsed;
}
function runsListPaginationPageSizeFromParams(params: URLSearchParams, fallbackPageSize: number): number {
  const fromSearch = params.get("pageSize");

  if (fromSearch === null) {
    return fallbackPageSize;
  }

  const parsed = Number.parseInt(fromSearch, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackPageSize;
  }

  return Math.min(parsed, REVIEWS_HUB_MAX_PAGE_SIZE);
}

export function runsListPreviousPageHrefFromSearch(
  currentSearch: string,
  pathname: string,
  projectId: string,
  pageSize: number,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    params.set("projectId", runsListPaginationProjectIdFromParams(params, projectId));
    params.set("pageSize", String(runsListPaginationPageSizeFromParams(params, pageSize)));
    params.set("page", "1");
    params.delete("cursor");
    },
  });
}

export function runsListNextPageHrefFromSearch(
  currentSearch: string,
  pathname: string,
  projectId: string,
  pageSize: number,
  nextPage: number,
  nextCursor: string | null | undefined,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    params.set("projectId", runsListPaginationProjectIdFromParams(params, projectId));
    params.set("pageSize", String(runsListPaginationPageSizeFromParams(params, pageSize)));
    params.set("page", String(runsListPaginationPageFromParams(params, nextPage - 1) + 1));

    if (nextCursor !== null && nextCursor !== undefined && nextCursor.length > 0) {
      params.set("cursor", nextCursor);
    } else {
      params.delete("cursor");
    }
    },
  });
}
