export const MANIFEST_TOP_DECISIONS_AREA_KEY_PARAM = "manifestTopDecisionsAreaKey";

export function parseManifestTopDecisionsAreaKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function manifestTopDecisionsAreaDisclosureHrefFromSearch(
  currentSearch: string,
  areaKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (areaKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(MANIFEST_TOP_DECISIONS_AREA_KEY_PARAM);
  } else {
    params.set(MANIFEST_TOP_DECISIONS_AREA_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
