import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

function runsListPaginationProjectIdFromParams(params: URLSearchParams, fallbackProjectId: string): string {
  const fromSearch = params.get("projectId");

  if (fromSearch !== null && fromSearch.trim().length > 0) {
    return fromSearch.trim();
  }

  return fallbackProjectId;
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
    params.set("pageSize", String(pageSize));
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
    params.set("pageSize", String(pageSize));
    params.set("page", String(nextPage));

    if (nextCursor !== null && nextCursor !== undefined && nextCursor.length > 0) {
      params.set("cursor", nextCursor);
    } else {
      params.delete("cursor");
    }
    },
  });
}
