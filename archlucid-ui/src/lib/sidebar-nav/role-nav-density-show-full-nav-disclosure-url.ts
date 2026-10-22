import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ROLE_NAV_DENSITY_SHOW_FULL_NAV_OPEN_PARAM = "roleNavDensityShowFullNavOpen";

export function parseRoleNavDensityShowFullNavOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function roleNavDensityShowFullNavDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ROLE_NAV_DENSITY_SHOW_FULL_NAV_OPEN_PARAM);
}
