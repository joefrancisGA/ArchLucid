/**
 * Whether a sidebar / drawer link should show the active style for the current pathname.
 * Query strings on `href` are ignored; pathname never includes query in Next.js App Router.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  const pathPart = href.split("?")[0] ?? "/";

  if (pathPart === "/") {
    return pathname === "/";
  }

  if (pathPart === "/architecture/reviews/new" || pathPart === "/reviews/new") {
    return pathname === "/architecture/reviews/new" || pathname === "/reviews/new";
  }

  if (pathPart === "/architecture/architectures" || pathPart === "/architectures") {
    return (
      pathname === "/architecture/architectures"
      || pathname.startsWith("/architecture/architectures/")
      || pathname === "/architectures"
      || pathname.startsWith("/architectures/")
    );
  }

  if (pathPart === "/architecture/reviews" || pathPart === "/reviews") {
    return pathname === "/architecture/reviews" || pathname === "/reviews";
  }

  if (pathPart === "/administration/settings/tenant") {
    return pathname === "/administration/settings/tenant";
  }

  return pathname === pathPart || pathname.startsWith(`${pathPart}/`);
}
