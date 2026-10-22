import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_FINDINGS_LINKED_VIEW_PARAM = "linkedView";

export function parseArchitectureFindingsLinkedViewFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureFindingsLinkedViewHrefFromSearch(
  currentSearch: string,
  linkedViewOpen: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, linkedViewOpen, pathname, ARCHITECTURE_FINDINGS_LINKED_VIEW_PARAM);
}
