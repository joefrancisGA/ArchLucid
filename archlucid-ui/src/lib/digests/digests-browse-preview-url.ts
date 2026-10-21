import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const DIGESTS_BROWSE_PREVIEW_PARAM = "preview";

export function parseDigestsBrowsePreviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return true;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "0" || trimmed === "false") {
    return false;
  }

  return true;
}

export function digestsBrowsePreviewHrefFromSearch(
  currentSearch: string,
  previewOpen: boolean,
  pathname: string = DIGESTS_HUB_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (previewOpen) {
      params.delete(DIGESTS_BROWSE_PREVIEW_PARAM);
    } else {
      params.set(DIGESTS_BROWSE_PREVIEW_PARAM, "0");
    }
    },
  });
}
