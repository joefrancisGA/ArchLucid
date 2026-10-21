import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ASK_CANNED_PROMPT_FOLLOW_UPS_OPEN_PARAM = "askCannedPromptFollowUpsOpen";

export function parseAskCannedPromptFollowUpsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function askCannedPromptFollowUpsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ASK_CANNED_PROMPT_FOLLOW_UPS_OPEN_PARAM);
}
