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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SSO_WIZARD_PROTOCOL_HELP_OPEN_PARAM);
  } else {
    params.set(SSO_WIZARD_PROTOCOL_HELP_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
