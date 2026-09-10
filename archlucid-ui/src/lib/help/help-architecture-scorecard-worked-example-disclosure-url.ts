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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_ARCHITECTURE_SCORECARD_WORKED_EXAMPLE_OPEN_PARAM);
  } else {
    params.set(HELP_ARCHITECTURE_SCORECARD_WORKED_EXAMPLE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
