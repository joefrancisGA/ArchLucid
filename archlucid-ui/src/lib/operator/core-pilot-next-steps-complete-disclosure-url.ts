export const CORE_PILOT_NEXT_STEPS_COMPLETE_OPEN_PARAM = "corePilotNextStepsCompleteOpen";

export function parseCorePilotNextStepsCompleteOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function corePilotNextStepsCompleteDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(CORE_PILOT_NEXT_STEPS_COMPLETE_OPEN_PARAM);
  } else {
    params.set(CORE_PILOT_NEXT_STEPS_COMPLETE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
