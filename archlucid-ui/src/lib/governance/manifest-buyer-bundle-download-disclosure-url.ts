import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, MANIFEST_BUYER_BUNDLE_DOWNLOAD_OPEN_PARAM);
}
