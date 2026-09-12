export function runsListPreviousPageHrefFromSearch(
  currentSearch: string,
  pathname: string,
  projectId: string,
  pageSize: number,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set("projectId", projectId);
  params.set("pageSize", String(pageSize));
  params.set("page", "1");
  params.delete("cursor");

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function runsListNextPageHrefFromSearch(
  currentSearch: string,
  pathname: string,
  projectId: string,
  pageSize: number,
  nextPage: number,
  nextCursor: string | null | undefined,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set("projectId", projectId);
  params.set("pageSize", String(pageSize));
  params.set("page", String(nextPage));

  if (nextCursor !== null && nextCursor !== undefined && nextCursor.length > 0) {
    params.set("cursor", nextCursor);
  } else {
    params.delete("cursor");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
