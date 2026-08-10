import type { ArchLucidAppRole } from "@/lib/current-principal";

export function settingsRolesRoleChangeRequiresConfirmation(nextRole: ArchLucidAppRole): boolean {
  return nextRole === "Admin" || nextRole === "Operator";
}
