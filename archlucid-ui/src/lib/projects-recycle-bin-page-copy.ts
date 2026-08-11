import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

/** Canonical page title for `/administration/tenant/recycle-bin`. */
export const PROJECTS_RECYCLE_BIN_PAGE_TITLE = "Projects recycle bin";

export const PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_LABEL = "Administration";

export const PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_HREF = SETTINGS_ROOT_PATH;

/** Operator empty-state title when the retention window has no soft-deleted projects. */
export const PROJECTS_RECYCLE_BIN_EMPTY_STATE_TITLE = "No deleted projects";

/** Ready/quiet status chip on the happy-empty recycle bin state (TB-1291). */
export const PROJECTS_RECYCLE_BIN_EMPTY_STATE_STATUS_LABEL = "Quiet";

/** Loading notice while the recycle-bin API hydrates the page. */
export const PROJECTS_RECYCLE_BIN_LOADING_NOTICE = "Loading deleted projects…";

export const PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_HREF = "/architecture/architectures";

export const PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_LINK_LABEL = "Architecture drafts";
