/**
 * Whether a sidebar / drawer link should show the active style for the current pathname.
 * Query strings on `href` are ignored; pathname never includes query in Next.js App Router.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  const pathPart = href.split("?")[0] ?? "/";

  if (pathPart === "/") {
    return pathname === "/";
  }

  if (pathPart === "/runs/new") {
    return pathname === "/runs/new";
  }

  if (pathPart === "/runs") {
    return pathname === "/runs";
  }

  return pathname === pathPart || pathname.startsWith(`${pathPart}/`);
}
