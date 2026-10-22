import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_OPEN_PARAM = "identityProvidersDiagnosticsTechnicalOpen";

export function parseIdentityProvidersDiagnosticsTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function identityProvidersDiagnosticsTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_OPEN_PARAM);
}
