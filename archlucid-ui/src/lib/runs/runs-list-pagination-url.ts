import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export function runsListPreviousPageHrefFromSearch(
  currentSearch: string,
  pathname: string,
  projectId: string,
  pageSize: number,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    params.set("projectId", projectId);
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
    params.set("projectId", projectId);
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
