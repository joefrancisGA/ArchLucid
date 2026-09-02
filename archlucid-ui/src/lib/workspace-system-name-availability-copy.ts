/** Copy for proactive workspace system/review name availability checks (TB-2005). */

export type WorkspaceSystemNameOccupancyKind = "review" | "architecture";

export const WORKSPACE_SYSTEM_NAME_CHECKING_HELPER = "Checking whether this name is available…";

export function workspaceSystemNameConflictMessage(
  systemName: string,
  occupancyKind: WorkspaceSystemNameOccupancyKind = "review",
): string {
  const trimmed = systemName.trim();

  return occupancyKind === "architecture"
    ? `An architecture named '${trimmed}' already exists in this workspace.`
    : `A review named '${trimmed}' already exists in this workspace.`;
}

export function workspaceSystemNameConflictRecoveryHelper(
  occupancyKind: WorkspaceSystemNameOccupancyKind = "review",
): string {
  return occupancyKind === "architecture"
    ? "Open the existing architecture from your list or choose a different name."
    : "Open the existing review from your list, use Re-run review, or choose a different name.";
}

export const WORKSPACE_SYSTEM_NAME_CONFLICT_RECOVERY_HELPER =
  workspaceSystemNameConflictRecoveryHelper("review");

export const WORKSPACE_SYSTEM_NAME_VALIDATION_UNAVAILABLE_HELPER =
  "Name availability could not be verified right now. You can continue, but a duplicate name may still be rejected when you submit.";
