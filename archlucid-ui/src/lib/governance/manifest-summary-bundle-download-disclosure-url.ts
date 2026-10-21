import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, MANIFEST_SUMMARY_BUNDLE_DOWNLOAD_OPEN_PARAM);
}
