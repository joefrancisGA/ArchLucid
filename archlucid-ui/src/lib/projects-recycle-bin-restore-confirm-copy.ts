export const PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE = "Restore project?";

export function projectsRecycleBinRestoreConfirmDescription(
  projectName: string,
  workspaceName: string,
): string {
  const trimmedProject = projectName.trim();
  const trimmedWorkspace = workspaceName.trim();

  return `Restore "${trimmedProject}" to active projects in workspace "${trimmedWorkspace}". The project name must not already be used by another active project in that workspace.`;
}

export const PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL = "Restore";

export const PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_CANCEL_LABEL = "Cancel";
