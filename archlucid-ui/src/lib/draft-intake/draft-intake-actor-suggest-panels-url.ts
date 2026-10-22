import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, suggestOpen, pathname, DRAFT_INTAKE_ACTOR_SUGGEST_OPEN_PARAM);
}
