import type { CurrentPrincipal } from "@/lib/current-principal";

import type { SettingsRolesAssignablePrincipalRow } from "./settings-roles-page-types";

/**
 * Best-effort match of a directory row to the signed-in principal.
 * When identity is incomplete (empty name), treat every user row as self so
 * the table cannot silently demote the caller.
 */
export function isSettingsRolesPrincipalSelfRow(
  row: SettingsRolesAssignablePrincipalRow,
  currentPrincipal: CurrentPrincipal,
): boolean {
  if (row.kind !== "user") {
    return false;
  }

  const principalName = currentPrincipal.name?.trim().toLowerCase() ?? "";

  if (principalName.length === 0) {
    return true;
  }

  const rowName = row.name.trim().toLowerCase();

  if (rowName === principalName) {
    return true;
  }

  const rowEmail = row.detail.trim().toLowerCase();

  if (rowEmail.length > 0 && rowEmail === principalName) {
    return true;
  }

  const emailLocalPart = rowEmail.includes("@") ? rowEmail.slice(0, rowEmail.indexOf("@")) : rowEmail;
  const principalAsLocalPart = principalName.replace(/\s+/g, ".");

  return emailLocalPart.length > 0 && emailLocalPart === principalAsLocalPart;
}
