import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_DELIVERABLES_OPEN_PARAM = "runDeliverablesOpen";

export function parseRunDeliverablesOpenFromSearch(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed === "1" || trimmed === "true";
}

export function runDetailDeliverablesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_DELIVERABLES_OPEN_PARAM);
}
