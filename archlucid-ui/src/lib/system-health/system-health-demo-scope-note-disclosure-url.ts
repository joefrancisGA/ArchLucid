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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SYSTEM_HEALTH_DEMO_SCOPE_NOTE_OPEN_PARAM);
  } else {
    params.set(SYSTEM_HEALTH_DEMO_SCOPE_NOTE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
