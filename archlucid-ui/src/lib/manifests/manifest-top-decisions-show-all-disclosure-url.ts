import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const MANIFEST_TOP_DECISIONS_SHOW_ALL_OPEN_PARAM = "manifestTopDecisionsShowAllOpen";

export function parseManifestTopDecisionsShowAllOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function manifestTopDecisionsShowAllDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, MANIFEST_TOP_DECISIONS_SHOW_ALL_OPEN_PARAM);
}
