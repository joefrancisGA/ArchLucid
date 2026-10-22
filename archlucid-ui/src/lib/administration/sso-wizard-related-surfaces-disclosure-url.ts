import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SSO_WIZARD_RELATED_SURFACES_OPEN_PARAM = "ssoWizardRelatedSurfacesOpen";

export function parseSsoWizardRelatedSurfacesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function ssoWizardRelatedSurfacesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SSO_WIZARD_RELATED_SURFACES_OPEN_PARAM);
}
