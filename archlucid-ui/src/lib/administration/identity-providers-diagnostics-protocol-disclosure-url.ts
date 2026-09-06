export const IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_OPEN_PARAM = "identityProvidersDiagnosticsProtocolOpen";

export function parseIdentityProvidersDiagnosticsProtocolOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function identityProvidersDiagnosticsProtocolDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_OPEN_PARAM);
  } else {
    params.set(IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
