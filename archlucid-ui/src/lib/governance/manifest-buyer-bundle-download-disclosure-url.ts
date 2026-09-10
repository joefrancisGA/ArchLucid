export const MANIFEST_BUYER_BUNDLE_DOWNLOAD_OPEN_PARAM = "manifestBuyerBundleDownloadOpen";

export function parseManifestBuyerBundleDownloadOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function manifestBuyerBundleDownloadDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(MANIFEST_BUYER_BUNDLE_DOWNLOAD_OPEN_PARAM);
  } else {
    params.set(MANIFEST_BUYER_BUNDLE_DOWNLOAD_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
