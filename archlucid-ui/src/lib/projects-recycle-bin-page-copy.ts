import { SETTINGS_ROOT_PATH, SETTINGS_TENANT_PATH } from "@/lib/settings-admin-route-paths";

/** Canonical page title for `/administration/workspace-settings/recycle-bin`. */
export const PROJECTS_RECYCLE_BIN_PAGE_TITLE = "Projects recycle bin";

export const PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_LABEL = "Administration";

export const PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_HREF = SETTINGS_ROOT_PATH;

export const PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_LABEL = "Workspace settings";

export const PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_HREF = SETTINGS_TENANT_PATH;

/** Shown when the recycle-bin API does not return a deleter display name for a row. */
export const PROJECTS_RECYCLE_BIN_DELETED_BY_NOT_RECORDED = "Not recorded";

/** Per-row audit trail link label (destructive-admin provenance). */
export const PROJECTS_RECYCLE_BIN_ROW_AUDIT_TRAIL_LINK_LABEL = "View in audit trail";

/** Page-level honesty when deleter attribution is not yet on the recycle-bin API. */
export const PROJECTS_RECYCLE_BIN_AUDIT_TRAIL_ATTRIBUTION_NOTE =
  "Project soft-delete and restore events are recorded in the audit trail. Deleter attribution is not shown in this table until the recycle-bin API exposes it.";

/** Operator empty-state title when the retention window has no soft-deleted projects. */
export const PROJECTS_RECYCLE_BIN_EMPTY_STATE_TITLE = "No deleted projects";

/** Ready/quiet status chip on the happy-empty recycle bin state (TB-1291). */
export const PROJECTS_RECYCLE_BIN_EMPTY_STATE_STATUS_LABEL = "Quiet";

/** Loading notice while the recycle-bin API hydrates the page. */
export const PROJECTS_RECYCLE_BIN_LOADING_NOTICE = "Loading deleted projects…";

export const PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_HREF = "/architecture/architectures";

export const PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_LINK_LABEL = "Architecture drafts";

export const PROJECTS_RECYCLE_BIN_EMPTY_DELETE_SURFACE_HREF = "/administration/workspace-settings";

export const PROJECTS_RECYCLE_BIN_EMPTY_DELETE_SURFACE_LINK_LABEL = "Workspace settings";

export const PROJECTS_RECYCLE_BIN_RESTORE_SUCCESS_STATUS_LABEL = "Restored";

export const PROJECTS_RECYCLE_BIN_RESTORE_CONFLICT_STATUS_LABEL = "Action needed";

export const PROJECTS_RECYCLE_BIN_RESTORE_ERROR_STATUS_LABEL = "Restore failed";

export const PROJECTS_RECYCLE_BIN_LOAD_ERROR_STATUS_LABEL = "Load failed";
