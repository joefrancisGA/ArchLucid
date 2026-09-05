export const COMPARE_MANIFEST_DIFF_OPEN_PARAM = "compareManifestDiffOpen";

export function parseCompareManifestDiffOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareManifestDiffHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(COMPARE_MANIFEST_DIFF_OPEN_PARAM);
  } else {
    params.set(COMPARE_MANIFEST_DIFF_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
