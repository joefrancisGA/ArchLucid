import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const DIGESTS_BROWSE_DIGEST_PARAM = "digest";

export function parseDigestsBrowseDigestIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function digestsBrowseDigestHrefFromSearch(
  currentSearch: string,
  digestId: string,
  pathname: string = DIGESTS_HUB_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = digestId.trim();

    if (trimmed.length === 0) {
      params.delete(DIGESTS_BROWSE_DIGEST_PARAM);
    } else {
      params.set(DIGESTS_BROWSE_DIGEST_PARAM, trimmed);
    }
    },
  });
}
