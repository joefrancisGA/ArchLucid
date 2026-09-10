export const AFTER_CORE_PILOT_WHATS_NEXT_OPEN_PARAM = "afterCorePilotWhatsNextOpen";

export function parseAfterCorePilotWhatsNextOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return true;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "0" || trimmed === "false") {
    return false;
  }

  return trimmed === "1" || trimmed === "true";
}

export function afterCorePilotWhatsNextDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (open) {
    params.delete(AFTER_CORE_PILOT_WHATS_NEXT_OPEN_PARAM);
  } else {
    params.set(AFTER_CORE_PILOT_WHATS_NEXT_OPEN_PARAM, "0");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
