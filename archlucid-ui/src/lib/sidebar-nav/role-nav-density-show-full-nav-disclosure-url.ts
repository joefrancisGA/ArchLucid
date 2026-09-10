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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ROLE_NAV_DENSITY_SHOW_FULL_NAV_OPEN_PARAM);
  } else {
    params.set(ROLE_NAV_DENSITY_SHOW_FULL_NAV_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
