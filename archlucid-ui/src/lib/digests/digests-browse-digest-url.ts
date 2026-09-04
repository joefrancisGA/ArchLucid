import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = digestId.trim();

  if (trimmed.length === 0) {
    params.delete(DIGESTS_BROWSE_DIGEST_PARAM);
  } else {
    params.set(DIGESTS_BROWSE_DIGEST_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
