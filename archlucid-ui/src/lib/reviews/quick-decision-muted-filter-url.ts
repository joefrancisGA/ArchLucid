import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const QUICK_DECISION_SHOW_MUTED_PARAM = "showMuted";

export function parseQuickDecisionShowMutedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function quickDecisionMutedFilterHrefFromSearch(
  currentSearch: string,
  showMuted: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, showMuted, pathname, QUICK_DECISION_SHOW_MUTED_PARAM);
}
