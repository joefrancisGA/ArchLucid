import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { isSelfSettingsPath } from "@/lib/self-settings-destinations";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

/**
 * Whether a sidebar / drawer link should show the active style for the current pathname.
 * Query strings on `href` are ignored; pathname never includes query in Next.js App Router.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  const pathPart = href.split("?")[0] ?? "/";

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

  if (pathPart === "/administration/tenant") {
    return pathname === "/administration/tenant";
  }

  if (pathPart === "/governance/approval-queue") {
    return (
      pathname === "/governance/approval-queue" ||
      pathname.startsWith("/governance/approval-requests/")
    );
  }

  if (pathPart === SETTINGS_ROOT_PATH) {
    if (isSelfSettingsPath(pathname)) {
      return false;
    }

    return pathname === SETTINGS_ROOT_PATH || pathname.startsWith(`${SETTINGS_ROOT_PATH}/`);
  }

  return pathname === pathPart || pathname.startsWith(`${pathPart}/`);
}
