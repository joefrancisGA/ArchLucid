import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_CREATE_WORK_ITEM_OPEN_PARAM = "architectureCreateWorkItemOpen";

export function parseArchitectureCreateWorkItemOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureCreateWorkItemDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARCHITECTURE_CREATE_WORK_ITEM_OPEN_PARAM);
}
