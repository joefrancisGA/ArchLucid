import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_INSPECTOR_RELATED_ACTIONS_OPEN_PARAM = "runInspectorRelatedActionsOpen";

export function parseRunInspectorRelatedActionsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runInspectorRelatedActionsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_INSPECTOR_RELATED_ACTIONS_OPEN_PARAM);
}
