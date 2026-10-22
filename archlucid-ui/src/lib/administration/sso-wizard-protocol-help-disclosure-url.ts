import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SSO_WIZARD_PROTOCOL_HELP_OPEN_PARAM = "ssoWizardProtocolHelpOpen";

export function parseSsoWizardProtocolHelpOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function ssoWizardProtocolHelpDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SSO_WIZARD_PROTOCOL_HELP_OPEN_PARAM);
}
