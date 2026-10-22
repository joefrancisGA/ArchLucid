import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SYSTEM_HEALTH_DEMO_SCOPE_NOTE_OPEN_PARAM = "systemHealthDemoScopeNoteOpen";

export function parseSystemHealthDemoScopeNoteOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function systemHealthDemoScopeNoteDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SYSTEM_HEALTH_DEMO_SCOPE_NOTE_OPEN_PARAM);
}
