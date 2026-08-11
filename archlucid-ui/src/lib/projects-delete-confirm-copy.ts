export const PROJECT_DELETE_CONFIRM_TITLE = "Delete project?";

export function projectDeleteConfirmDescription(
  projectName: string,
  workspaceName: string,
  retentionDays: number,
): string {
  const trimmedProject = projectName.trim();
  const trimmedWorkspace = workspaceName.trim();

  return `Move "${trimmedProject}" from workspace "${trimmedWorkspace}" to the recycle bin. It stays recoverable for ${retentionDays} days. Restore from Projects recycle bin if you need it back — the name must not collide with another active project.`;
}

export const PROJECT_DELETE_CONFIRM_ACTION_LABEL = "Delete project";

export const PROJECT_DELETE_CONFIRM_CANCEL_LABEL = "Cancel";

export const PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON =
  "The workspace default architecture project cannot be deleted. Create another project and re-point the workspace default first.";

export const PROJECT_DELETE_EXECUTE_DISABLED_REASON =
  "Deleting projects requires Execute authority in this workspace.";

export function projectDeleteSuccessToastMessage(projectName: string): string {
  return `Project "${projectName.trim()}" moved to recycle bin.`;
}

export const PROJECT_DELETE_SUCCESS_TOAST_ACTION_LABEL = "Open recycle bin";

export const PROJECT_DELETE_NOT_FOUND_MESSAGE =
  "Architecture project was not found or is already deleted.";

export const PROJECT_DELETE_NAME_CONFLICT_MESSAGE =
  "Another active project already uses this name in the workspace.";
