import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_SLACK_CREDENTIAL_HANDLING_OPEN_PARAM = "helpSlackCredentialHandlingOpen";

export function parseHelpSlackCredentialHandlingOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpSlackCredentialHandlingDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_SLACK_CREDENTIAL_HANDLING_OPEN_PARAM);
}
