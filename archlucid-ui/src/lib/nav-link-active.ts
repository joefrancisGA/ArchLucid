import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { isSelfSettingsPath } from "@/lib/self-settings-destinations";
import {
  SETTINGS_ROOT_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
  pathMatchesSettingsWorkspaceSettings,
} from "@/lib/settings-admin-route-paths";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { navHrefPathPart } from "@/lib/nav-href-path-part";
import { PROJECTS_RECYCLE_BIN_PATH } from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";

/**
 * Whether a sidebar / drawer link should show the active style for the current pathname.
 * Query strings and fragments on `href` are ignored; pathname never includes those in Next.js App Router.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  const pathPart = navHrefPathPart(href);

  if (pathPart.length === 0) {
    return false;
  }

  if (pathPart === "/") {
    return pathname === "/";
  }

  if (pathPart === REVIEWS_NEW_PATH) {
    return pathname === REVIEWS_NEW_PATH;
  }

  if (pathPart === ARCHITECTURES_LIST_PATH) {
    return pathname === ARCHITECTURES_LIST_PATH || pathname.startsWith(`${ARCHITECTURES_LIST_PATH}/`);
  }

  // Reviews list is exact-match only — detail/new routes must not highlight the hub item.
  if (pathPart === REVIEWS_LIST_PATH) {
    return pathname === REVIEWS_LIST_PATH;
  }

  // Findings queue is exact-match only — assigned-to-me child route must not highlight the hub item.
  if (pathPart === GOVERNANCE_FINDINGS_PATH) {
    return pathname === GOVERNANCE_FINDINGS_PATH;
  }

  if (pathPart === SETTINGS_WORKSPACE_SETTINGS_PATH) {
    return pathMatchesSettingsWorkspaceSettings(pathname) && !pathname.startsWith(`${SETTINGS_WORKSPACE_SETTINGS_PATH}/recycle-bin`);
  }

  if (pathPart === "/governance/approval-queue") {
    return (
      pathname === "/governance/approval-queue" ||
      pathname.startsWith("/governance/approval-requests/")
    );
  }

  if (pathPart === SETTINGS_ROOT_PATH) {
    if (isSelfSettingsPath(pathname) || pathname === PROJECTS_RECYCLE_BIN_PATH) {
      return false;
    }

    return pathname === SETTINGS_ROOT_PATH || pathname.startsWith(`${SETTINGS_ROOT_PATH}/`);
  }

  return pathname === pathPart || pathname.startsWith(`${pathPart}/`);
}
