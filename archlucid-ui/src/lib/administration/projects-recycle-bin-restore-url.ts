import { SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH } from "@/lib/settings-admin-route-paths";

export const PROJECTS_RECYCLE_BIN_RESTORE_PARAM = "restoreProject";

export function parseProjectsRecycleBinRestoreProjectIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function projectsRecycleBinRestoreHrefFromSearch(
  currentSearch: string,
  projectId: string | null,
  pathname: string = SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (projectId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(PROJECTS_RECYCLE_BIN_RESTORE_PARAM);
  } else {
    params.set(PROJECTS_RECYCLE_BIN_RESTORE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
