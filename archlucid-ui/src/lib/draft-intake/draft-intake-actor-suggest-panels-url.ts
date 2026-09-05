export const DRAFT_INTAKE_ACTOR_SUGGEST_OPEN_PARAM = "actorSuggestOpen";

export function parseDraftIntakeActorSuggestOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function draftIntakeActorSuggestPanelsHrefFromSearch(
  currentSearch: string,
  suggestOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!suggestOpen) {
    params.delete(DRAFT_INTAKE_ACTOR_SUGGEST_OPEN_PARAM);
  } else {
    params.set(DRAFT_INTAKE_ACTOR_SUGGEST_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
