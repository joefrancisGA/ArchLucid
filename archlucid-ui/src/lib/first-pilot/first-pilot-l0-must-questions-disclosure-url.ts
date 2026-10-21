import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FIRST_PILOT_L0_MUST_QUESTIONS_OPEN_PARAM = "firstPilotL0MustQuestionsOpen";

export function parseFirstPilotL0MustQuestionsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstPilotL0MustQuestionsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FIRST_PILOT_L0_MUST_QUESTIONS_OPEN_PARAM);
}
