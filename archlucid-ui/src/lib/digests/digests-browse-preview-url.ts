import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

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
  const params = new URLSearchParams(currentSearch);

  if (previewOpen) {
    params.delete(DIGESTS_BROWSE_PREVIEW_PARAM);
  } else {
    params.set(DIGESTS_BROWSE_PREVIEW_PARAM, "0");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
