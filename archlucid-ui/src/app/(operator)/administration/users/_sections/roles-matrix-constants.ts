import { roleDisplayLabel } from "@/lib/role-display-labels";

/** API/claim role ids. Buyer-facing labels come from `roleDisplayLabel` (aligned with built-in summaries). */
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
  "Built-in roles cannot be edited. Clone a built-in role to create a custom role.";

/** Notice shown above the matrix while custom role columns hold permission edits that were never saved. */
export function unsavedRoleEditsNotice(roleNames: readonly string[]): string {
  if (roleNames.length === 0)
    return "";

  return `Unsaved permission changes on ${roleNames.join(", ")}. Use Save on each role column to apply them.`;
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
