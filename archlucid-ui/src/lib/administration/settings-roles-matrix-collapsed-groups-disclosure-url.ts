import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (collapsedGroups.length === 0) {
      params.delete(SETTINGS_ROLES_MATRIX_COLLAPSED_GROUPS_PARAM);
    } else {
      params.set(SETTINGS_ROLES_MATRIX_COLLAPSED_GROUPS_PARAM, collapsedGroups.join(","));
    }
    },
  });
}
