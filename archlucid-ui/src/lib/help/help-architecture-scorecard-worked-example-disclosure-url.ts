import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_ARCHITECTURE_SCORECARD_WORKED_EXAMPLE_OPEN_PARAM = "helpArchitectureScorecardWorkedExampleOpen";

export function parseHelpArchitectureScorecardWorkedExampleOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpArchitectureScorecardWorkedExampleDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_ARCHITECTURE_SCORECARD_WORKED_EXAMPLE_OPEN_PARAM);
}
