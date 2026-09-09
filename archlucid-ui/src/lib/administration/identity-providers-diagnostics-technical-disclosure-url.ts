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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_OPEN_PARAM);
  } else {
    params.set(IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
