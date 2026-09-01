/** Copy for proactive workspace system/review name availability checks (TB-2005). */

export const WORKSPACE_SYSTEM_NAME_CHECKING_HELPER = "Checking whether this name is available…";

export function workspaceSystemNameConflictMessage(systemName: string): string {
  const trimmed = systemName.trim();

  return `A review or architecture named '${trimmed}' already exists in this workspace.`;
}

export const WORKSPACE_SYSTEM_NAME_CONFLICT_RECOVERY_HELPER =
  "Open the existing review from your list, use Re-run review, or choose a different name.";

export const WORKSPACE_SYSTEM_NAME_VALIDATION_UNAVAILABLE_HELPER =
  "Name availability could not be verified right now. You can continue, but a duplicate name may still be rejected when you submit.";
