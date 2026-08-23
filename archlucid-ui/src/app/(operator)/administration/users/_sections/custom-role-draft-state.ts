import { roleDisplayLabel } from "@/lib/role-display-labels";

import { ALL_MATRIX_PERMISSION_IDS } from "./custom-role-permission-groups";
import { HIGH_RISK_PERMISSION_IDS } from "./roles-matrix-constants";

export type PermissionChanges = {
  readonly added: string[];
  readonly removed: string[];
};

/** One role column in the permission matrix. Built-in roles are read-only; custom roles accumulate edits. */
export type DraftRole = {
  readonly id?: string;
  readonly name: string;
  /** Carried through saves so updating permissions cannot blank a description set elsewhere. */
  readonly description?: string | null;
  readonly permissions: ReadonlySet<string>;
  readonly isSystem: boolean;
  readonly updatedUtc?: string;
};

/** Last-saved permissions per role column, captured on load for dirty detection and discard. */
export type RolePermissionBaseline = ReadonlyMap<string, ReadonlySet<string>>;

/** Stable matrix identity for a column. Custom roles always carry an id; name is a defensive fallback. */
export function roleMatrixKey(role: DraftRole): string {
  return role.id ?? role.name;
}

/**
 * Matrix-visible permissions rendered in canonical order so two sets compare as plain strings.
 * Permissions outside the matrix are excluded because the UI cannot toggle them.
 */
function matrixPermissionSignature(permissions: ReadonlySet<string> | null | undefined): string {
  if (permissions === null || permissions === undefined)
    return "";

  return ALL_MATRIX_PERMISSION_IDS.filter((permission) => permissions.has(permission)).join("|");
}

/** Matrix-visible permissions of a role, in canonical order, ready to send to the API. */
export function matrixPermissionList(permissions: ReadonlySet<string>): string[] {
  return ALL_MATRIX_PERMISSION_IDS.filter((permission) => permissions.has(permission));
}

/** The built-in role a new custom role can be seeded from, or null when it is not loaded or seeded. */
export function findSystemRoleByName(roles: readonly DraftRole[], name: string): DraftRole | null {
  return roles.find((role) => role.isSystem && role.name === name) ?? null;
}

export function baselinePermissionsByKey(roles: readonly DraftRole[]): RolePermissionBaseline {
  return new Map(roles.map((role) => [roleMatrixKey(role), new Set(role.permissions)]));
}

/** True when a custom role column holds permission edits that were never persisted. */
export function isRoleDirty(role: DraftRole, baseline: RolePermissionBaseline): boolean {
  if (role.isSystem)
    return false;

  const saved = baseline.get(roleMatrixKey(role));

  if (saved === undefined)
    return false;

  return matrixPermissionSignature(role.permissions) !== matrixPermissionSignature(saved);
}

/** Buyer-facing names of every column holding unsaved edits; empty when the matrix is clean. */
export function dirtyRoleDisplayNames(roles: readonly DraftRole[], baseline: RolePermissionBaseline): string[] {
  return roles.filter((role) => isRoleDirty(role, baseline)).map((role) => roleDisplayLabel(role.name));
}

/** Custom role columns that still hold unsaved permission edits. */
export function dirtyRoles(roles: readonly DraftRole[], baseline: RolePermissionBaseline): DraftRole[] {
  return roles.filter((role) => isRoleDirty(role, baseline));
}

/** Count permission toggles between a dirty column and its last-saved baseline. */
export function countDirtyPermissions(role: DraftRole, baseline: RolePermissionBaseline): number {
  if (role.isSystem)
    return 0;

  const saved = baseline.get(roleMatrixKey(role));

  if (saved === undefined)
    return 0;

  let changes = 0;

  for (const permissionId of ALL_MATRIX_PERMISSION_IDS) {
    const wasAllowed = saved.has(permissionId);
    const isAllowed = role.permissions.has(permissionId);

    if (wasAllowed !== isAllowed)
      changes += 1;
  }

  return changes;
}

/** Total unsaved permission toggles across all dirty custom role columns. */
export function totalUnsavedPermissionChanges(roles: readonly DraftRole[], baseline: RolePermissionBaseline): number {
  return dirtyRoles(roles, baseline).reduce((total, role) => total + countDirtyPermissions(role, baseline), 0);
}

/** True when any custom role column still holds unsaved permission edits. */
export function hasUnsavedRoleEdits(roles: readonly DraftRole[], baseline: RolePermissionBaseline): boolean {
  return roles.some((role) => isRoleDirty(role, baseline));
}

/** Add or remove one permission on one custom role column. Built-in columns are never mutated. */
export function toggleRolePermission(
  roles: readonly DraftRole[],
  roleKey: string,
  permissionId: string,
): DraftRole[] {
  return roles.map((role) => {
    if (roleMatrixKey(role) !== roleKey || role.isSystem)
      return role;

    const nextPermissions = new Set(role.permissions);

    if (nextPermissions.has(permissionId))
      nextPermissions.delete(permissionId);
    else
      nextPermissions.add(permissionId);

    return { ...role, permissions: nextPermissions };
  });
}

/** Revert one column to its last saved permissions, discarding that column's unsaved edits. */
export function restoreRoleToBaseline(
  roles: readonly DraftRole[],
  roleKey: string,
  baseline: RolePermissionBaseline,
): DraftRole[] {
  const saved = baseline.get(roleKey);

  if (saved === undefined)
    return [...roles];

  return roles.map((role) => (roleMatrixKey(role) === roleKey ? { ...role, permissions: new Set(saved) } : role));
}

/**
 * Reloaded server rows with in-flight edits carried over. A refresh triggered by creating or cloning
 * another role must not silently discard unsaved permission changes on other columns.
 */
export function mergeUnsavedRoleEdits(
  reloaded: readonly DraftRole[],
  current: readonly DraftRole[],
  baseline: RolePermissionBaseline,
): DraftRole[] {
  const unsavedByKey = new Map<string, ReadonlySet<string>>(
    current
      .filter((role) => isRoleDirty(role, baseline))
      .map((role) => [roleMatrixKey(role), role.permissions]),
  );

  return reloaded.map((role) => {
    const unsaved = unsavedByKey.get(roleMatrixKey(role));

    if (unsaved === undefined)
      return role;

    return { ...role, permissions: new Set(unsaved) };
  });
}

/** Generated name for a cloned role, using the buyer-facing label of the source role. */
export function clonedRoleName(source: DraftRole): string {
  return `${roleDisplayLabel(source.name)} (custom)`;
}

/** Matrix permission ids added or removed relative to the last-saved baseline for one column. */
export function permissionChangesForRole(role: DraftRole, baseline: RolePermissionBaseline): PermissionChanges {
  const saved = baseline.get(roleMatrixKey(role));
  const added: string[] = [];
  const removed: string[] = [];

  for (const permissionId of ALL_MATRIX_PERMISSION_IDS) {
    const wasAllowed = saved?.has(permissionId) ?? false;
    const isAllowed = role.permissions.has(permissionId);

    if (!wasAllowed && isAllowed)
      added.push(permissionId);

    if (wasAllowed && !isAllowed)
      removed.push(permissionId);
  }

  return { added, removed };
}

/** High-risk permission ids newly granted on a custom role column versus its baseline. */
export function newlyGrantedHighRiskPermissionIds(role: DraftRole, baseline: RolePermissionBaseline): string[] {
  return permissionChangesForRole(role, baseline).added.filter((permissionId) =>
    HIGH_RISK_PERMISSION_IDS.has(permissionId),
  );
}

/** High-risk permission ids in a new role permission list (create / clone — no prior baseline). */
export function newlyGrantedHighRiskPermissionIdsFromList(permissions: readonly string[]): string[] {
  return permissions.filter((permissionId) => HIGH_RISK_PERMISSION_IDS.has(permissionId));
}
