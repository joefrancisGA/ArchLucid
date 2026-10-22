import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_OPEN_PARAM);
}
