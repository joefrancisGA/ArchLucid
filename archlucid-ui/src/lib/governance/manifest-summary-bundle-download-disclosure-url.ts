export const MANIFEST_SUMMARY_BUNDLE_DOWNLOAD_OPEN_PARAM = "manifestSummaryBundleDownloadOpen";

export function parseManifestSummaryBundleDownloadOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function manifestSummaryBundleDownloadDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(MANIFEST_SUMMARY_BUNDLE_DOWNLOAD_OPEN_PARAM);
  } else {
    params.set(MANIFEST_SUMMARY_BUNDLE_DOWNLOAD_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
