import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_SEAL_DELTA_OPEN_PARAM = "architectureSealDeltaOpen";

export function parseArchitectureSealDeltaOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureSealDeltaDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARCHITECTURE_SEAL_DELTA_OPEN_PARAM);
}
