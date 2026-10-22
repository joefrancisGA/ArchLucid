import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const MANIFEST_DETAIL_WARNINGS_OPEN_PARAM = "manifestDetailWarningsOpen";

export function parseManifestDetailWarningsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function manifestDetailWarningsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, MANIFEST_DETAIL_WARNINGS_OPEN_PARAM);
}
