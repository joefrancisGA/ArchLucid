import { roleDisplayLabel } from "@/lib/role-display-labels";

/** API/claim role ids. Buyer-facing labels come from `roleDisplayLabel` (Operator → Architect). */
export type BuiltinRoleName = "Admin" | "Auditor" | "Operator" | "Reader";

export const BUILTIN_ROLE_ORDER: readonly BuiltinRoleName[] = ["Admin", "Auditor", "Operator", "Reader"];

export type BuiltinRoleSummary = {
  readonly name: BuiltinRoleName;
  readonly description: string;
};

export const BUILTIN_ROLE_SUMMARIES: readonly BuiltinRoleSummary[] = [
  { name: "Admin", description: "Full workspace administration" },
  { name: "Auditor", description: "Read and export audit evidence" },
  { name: "Operator", description: "Run reviews and manage architecture-package workflows" },
  { name: "Reader", description: "Read-only review access" },
];

export type CustomRoleStartFromValue = BuiltinRoleName | "Empty";

export type CustomRoleStartFromOption = {
  /** API role id. Permission seeding matches this against role names returned by the API. */
  readonly value: CustomRoleStartFromValue;
  readonly label: string;
};

export const CUSTOM_ROLE_START_FROM_OPTIONS: readonly CustomRoleStartFromOption[] = [
  ...BUILTIN_ROLE_ORDER.map((roleName) => ({ value: roleName, label: roleDisplayLabel(roleName) })),
  { value: "Empty", label: "Empty (no permissions)" },
];

/** Permissions that warrant an explicit confirmation before granting on a custom role. */
export const HIGH_RISK_PERMISSION_IDS: ReadonlySet<string> = new Set([
  "Billing.Manage",
  "Tenants.ManageOwn",
  "Tenants.ManageAny",
  "Identity.ManageProviders",
  "AdminConsole.Access",
]);

export const ROLES_MATRIX_HELPER_COPY =
  "Built-in roles cannot be edited. Use Create custom role to start from a template, or Clone on a column to copy an existing role.";

export const ROLES_MATRIX_PERMISSION_LEGEND = {
  allowed: "Allowed",
  denied: "Not allowed",
} as const;

export const ROLES_MATRIX_CREATE_READINESS_COPY = "Enter a role name to continue.";

export const ROLES_MATRIX_CLONE_VS_CREATE_COPY =
  "Create custom role seeds permissions from Start from role. Clone copies the full column into a new custom role.";

export const ROLES_MATRIX_LEGEND_COPY =
  "A check mark means the permission is allowed. A dash means it is not. Built-in columns are read-only; custom role cells are editable.";

export type CreateCustomRoleReadiness = {
  readonly hasName: boolean;
  /** False when the chosen built-in role is missing from the loaded matrix, so seeding would grant nothing. */
  readonly startFromResolvable: boolean;
  readonly startFromLabel: string;
};

/** Why the create button is unavailable, or null when the form is ready to submit. */
export function createCustomRoleBlockedReason(readiness: CreateCustomRoleReadiness): string | null {
  if (!readiness.hasName)
    return "Enter a role name to create a custom role.";

  if (!readiness.startFromResolvable)
    return `Permissions for ${readiness.startFromLabel} could not be loaded. Refresh the matrix, or start from an empty permission set.`;

  return null;
}

/** Notice shown above the matrix while custom role columns hold permission edits that were never saved. */
export function unsavedRoleEditsNotice(roleNames: readonly string[], changeCount: number): string {
  if (roleNames.length === 0)
    return "";

  const roleLabel = roleNames.join(", ");

  if (changeCount === 1)
    return `1 unsaved permission change on ${roleLabel}. Save or discard from the action bar.`;

  return `${changeCount} unsaved permission changes on ${roleLabel}. Save or discard from the action bar.`;
}

export function formatRoleLastUpdated(updatedUtc: string | undefined): string | null {
  if (updatedUtc === undefined || updatedUtc.trim().length === 0)
    return null;

  const parsed = new Date(updatedUtc);

  if (Number.isNaN(parsed.getTime()))
    return null;

  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function sortMatrixRoles<T extends { name: string; isSystem: boolean }>(roles: readonly T[]): T[] {
  return [...roles].sort((left, right) => {
    if (left.isSystem && right.isSystem) {
      const leftIndex = BUILTIN_ROLE_ORDER.indexOf(left.name as BuiltinRoleName);
      const rightIndex = BUILTIN_ROLE_ORDER.indexOf(right.name as BuiltinRoleName);

      if (leftIndex === -1 && rightIndex === -1)
        return left.name.localeCompare(right.name);

      if (leftIndex === -1)
        return 1;

      if (rightIndex === -1)
        return -1;

      return leftIndex - rightIndex;
    }

    if (left.isSystem)
      return -1;

    if (right.isSystem)
      return 1;

    return left.name.localeCompare(right.name);
  });
}

export function hasHighRiskPermissions(permissions: ReadonlySet<string>): boolean {
  for (const permissionId of HIGH_RISK_PERMISSION_IDS) {
    if (permissions.has(permissionId))
      return true;
  }

  return false;
}

export function highRiskPermissionLabels(permissions: ReadonlySet<string>, labelsById: ReadonlyMap<string, string>): string[] {
  const labels: string[] = [];

  for (const permissionId of HIGH_RISK_PERMISSION_IDS) {
    if (!permissions.has(permissionId))
      continue;

    labels.push(labelsById.get(permissionId) ?? permissionId);
  }

  return labels;
}

export function highRiskPermissionLabelsFromIds(
  permissionIds: readonly string[],
  labelsById: ReadonlyMap<string, string>,
): string[] {
  return permissionIds
    .filter((permissionId) => HIGH_RISK_PERMISSION_IDS.has(permissionId))
    .map((permissionId) => labelsById.get(permissionId) ?? permissionId);
}

export function permissionLabelsFromIds(
  permissionIds: readonly string[],
  labelsById: ReadonlyMap<string, string>,
): string[] {
  return permissionIds.map((permissionId) => labelsById.get(permissionId) ?? permissionId);
}

export const ROLES_MATRIX_CONFIRMATION_DIALOG = {
  saveTitle: "Save role permissions?",
  createTitle: "Create custom role?",
  cloneTitle: "Clone role?",
  savePrimary: "Save changes",
  createPrimary: "Create role",
  clonePrimary: "Clone role",
  highRiskLead:
    "This change grants sensitive workspace controls. Confirm only if this role should manage billing, tenants, identity providers, or the admin console.",
} as const;
