/**
 * Routes backed by **`surface: "platform-admin"`** nav groups — expand the Administration
 * sidebar section when the user deep-links (so diagnostics are not hidden behind a blind toggle).
 */
export function pathnameTouchesPlatformAdminSurface(pathname: string): boolean {
  if (
    pathname.startsWith("/admin/pricing-quote-aging") ||
    pathname.startsWith("/admin/trial-funnel") ||
    pathname.startsWith("/admin/fleet-llm-cogs") ||
    pathname.startsWith("/admin/tenant-health") ||
    pathname.startsWith("/admin/deployment-status")
  ) {
    return false;
  }

  if (pathname.startsWith("/admin")) {
    return true;
  }

  if (pathname.startsWith("/administration/baseline")) {
    return true;
  }

  if (pathname === "/administration/tenant" || pathname.startsWith("/administration/tenant/")) {
    return true;
  }

  return false;
}
