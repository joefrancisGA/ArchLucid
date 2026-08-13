/** Operator routes that do not need Tier-1 shell status fan-out (help, auth handoff, access denied). */
const OPERATOR_SHELL_STATUS_READONLY_ROUTE_PREFIXES = ["/help", "/auth", "/403"] as const;

function normalizeOperatorRoutePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;

  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }

  return withoutQuery;
}

/** True when deferred shell status queries should run for the current operator route. */
export function shouldFetchOperatorShellStatusOnRoute(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined || pathname.length === 0) {
    return true;
  }

  const normalized = normalizeOperatorRoutePathname(pathname);

  for (const prefix of OPERATOR_SHELL_STATUS_READONLY_ROUTE_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  return true;
}
