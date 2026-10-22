import { HIGH_RISK_PERMISSION_IDS } from "./roles-matrix-constants";
import type { PermissionGroup } from "./custom-role-permission-groups";
import type { DraftRole } from "./custom-role-draft-state";

export type RolesMatrixPermissionFilter = {
  readonly searchQuery: string;
  readonly highRiskOnly: boolean;
  readonly differencesOnly: boolean;
};

export const EMPTY_ROLES_MATRIX_PERMISSION_FILTER: RolesMatrixPermissionFilter = {
  searchQuery: "",
  highRiskOnly: false,
  differencesOnly: false,
};

function permissionMatchesSearch(label: string, searchQuery: string): boolean {
  const normalized = searchQuery.trim().toLowerCase();

  if (normalized.length === 0)
    return true;

  return label.toLowerCase().includes(normalized);
}

function permissionDiffersAcrossRoles(permissionId: string, roles: readonly DraftRole[]): boolean {
  if (roles.length <= 1)
    return false;

  const firstAllowed = roles[0]?.permissions.has(permissionId) ?? false;

  for (const role of roles) {
    if (role.permissions.has(permissionId) !== firstAllowed)
      return true;
  }

  return false;
}

export function filterPermissionGroupsForMatrix(
  groups: readonly PermissionGroup[],
  roles: readonly DraftRole[],
  filter: RolesMatrixPermissionFilter,
): PermissionGroup[] {
  return groups
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) => {
        if (filter.highRiskOnly && !HIGH_RISK_PERMISSION_IDS.has(permission.id))
          return false;

        if (filter.differencesOnly && !permissionDiffersAcrossRoles(permission.id, roles))
          return false;

        if (!permissionMatchesSearch(permission.label, filter.searchQuery))
          return false;

        return true;
      }),
    }))
    .filter((group) => group.permissions.length > 0);
}
