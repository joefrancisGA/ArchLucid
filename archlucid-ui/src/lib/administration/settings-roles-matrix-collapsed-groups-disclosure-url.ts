export const SETTINGS_ROLES_MATRIX_COLLAPSED_GROUPS_PARAM = "settingsRolesMatrixCollapsedGroups";

export function parseSettingsRolesMatrixCollapsedGroupsFromSearch(
  raw: string | null | undefined,
): readonly string[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function settingsRolesMatrixCollapsedGroupsDisclosureHrefFromSearch(
  currentSearch: string,
  collapsedGroups: readonly string[],
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (collapsedGroups.length === 0) {
    params.delete(SETTINGS_ROLES_MATRIX_COLLAPSED_GROUPS_PARAM);
  } else {
    params.set(SETTINGS_ROLES_MATRIX_COLLAPSED_GROUPS_PARAM, collapsedGroups.join(","));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
