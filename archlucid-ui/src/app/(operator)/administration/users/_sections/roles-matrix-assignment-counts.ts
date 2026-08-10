import type { SettingsRolesAssignablePrincipalRow } from "./settings-roles-page-types";

/** Member and automation principal counts keyed by API role name (built-in or custom). */
export function assignmentCountsByRoleName(
  rows: readonly SettingsRolesAssignablePrincipalRow[],
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const roleName = row.role;
    counts.set(roleName, (counts.get(roleName) ?? 0) + 1);
  }

  return counts;
}

export function formatRoleAssignmentCount(count: number): string {
  if (count === 0)
    return "No assignments";

  if (count === 1)
    return "1 assignment";

  return `${count} assignments`;
}

export function formatRoleAssignmentDisplay(
  count: number,
  reliable: boolean,
): { readonly text: string; readonly linkable: boolean } {
  if (!reliable)
    return { text: "Assignments unavailable", linkable: false };

  return { text: formatRoleAssignmentCount(count), linkable: true };
}
