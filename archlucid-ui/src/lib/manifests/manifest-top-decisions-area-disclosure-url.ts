import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (areaKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(MANIFEST_TOP_DECISIONS_AREA_KEY_PARAM);
    } else {
      params.set(MANIFEST_TOP_DECISIONS_AREA_KEY_PARAM, trimmed);
    }
    },
  });
}
