export const CORE_PILOT_ACTOR_INTAKE_OPEN_PARAM = "corePilotActorIntakeOpen";

export function parseCorePilotActorIntakeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function corePilotActorIntakeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(CORE_PILOT_ACTOR_INTAKE_OPEN_PARAM);
  } else {
    params.set(CORE_PILOT_ACTOR_INTAKE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
