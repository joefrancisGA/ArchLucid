import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM = "runDetailStickyActionsTechnicalDetailOpen";

export function parseRunDetailStickyActionsTechnicalDetailOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runDetailStickyActionsTechnicalDetailDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM);
}
