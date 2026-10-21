import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, scopeGateOpen, pathname, SCOPE_GATE_OPEN_PARAM);
}
