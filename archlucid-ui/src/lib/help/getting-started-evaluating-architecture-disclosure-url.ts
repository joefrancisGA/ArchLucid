import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GETTING_STARTED_EVALUATING_ARCHITECTURE_OPEN_PARAM = "gettingStartedEvaluatingArchitectureOpen";

export function parseGettingStartedEvaluatingArchitectureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function gettingStartedEvaluatingArchitectureDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GETTING_STARTED_EVALUATING_ARCHITECTURE_OPEN_PARAM);
}
