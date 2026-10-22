export const PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE = "Restore project?";

export function projectsRecycleBinRestoreConfirmDescription(
  projectName: string,
  workspaceName: string,
  purgeAfterLabel?: string | null,
): string {
  const trimmedProject = projectName.trim();
  const trimmedWorkspace = workspaceName.trim();
  const purgeLabel = purgeAfterLabel?.trim() ?? "";

  const deadlineLine =
    purgeLabel.length > 0
      ? ` Permanent removal is scheduled for ${purgeLabel}; restore before then.`
      : " Restore before the tenant retention window ends permanent removal.";

  return `Restore "${trimmedProject}" to active projects in workspace "${trimmedWorkspace}". The project name must not already be used by another active project in that workspace.${deadlineLine}`;
}

export const PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL = "Restore";

export const PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_CANCEL_LABEL = "Cancel";
