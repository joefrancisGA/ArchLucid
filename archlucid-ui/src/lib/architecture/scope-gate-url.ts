export const SCOPE_GATE_OPEN_PARAM = "scopeGate";

export function parseScopeGateOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function scopeGateHrefFromSearch(
  currentSearch: string,
  scopeGateOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!scopeGateOpen) {
    params.delete(SCOPE_GATE_OPEN_PARAM);
  } else {
    params.set(SCOPE_GATE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
