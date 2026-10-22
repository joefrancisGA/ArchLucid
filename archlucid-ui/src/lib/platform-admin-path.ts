/**
 * Routes backed by **`surface: "platform-admin"`** nav groups — expand the Administration
 * sidebar section when the user deep-links (so diagnostics are not hidden behind a blind toggle).
 */
export function pathnameTouchesPlatformAdminSurface(pathname: string): boolean {
  if (pathname.startsWith("/internal")) {
    return false;
  }

  if (pathname.startsWith("/administration/baseline")) {
    return true;
  }

  if (pathname === "/administration/workspace-settings" || pathname.startsWith("/administration/workspace-settings/")) {
    return true;
  }

  return false;
}
