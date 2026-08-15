import type { ReadonlyURLSearchParams } from "next/navigation";

/** Operator routes that do not need Tier-1 shell status fan-out (help, auth handoff, access denied). */
const OPERATOR_SHELL_STATUS_READONLY_ROUTE_PREFIXES = [
  "/help",
  "/auth",
  "/403",
  "/integrations/itsm/oauth",
] as const;

const OPERATOR_REVIEW_WORKSPACE_PATH_PATTERN = /^\/architecture\/reviews\/[^/]+/;

function normalizeOperatorRoutePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;

  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }

  return withoutQuery;
}

function resolveOperatorRouteSearchParams(
  searchParams?: URLSearchParams | ReadonlyURLSearchParams | string | null,
): URLSearchParams | null {
  if (searchParams === null || searchParams === undefined) {
    return null;
  }

  if (typeof searchParams === "string") {
    const trimmed = searchParams.startsWith("?") ? searchParams.slice(1) : searchParams;

    if (trimmed.length === 0) {
      return null;
    }

    return new URLSearchParams(trimmed);
  }

  return searchParams;
}

function isOperatorReviewWorkspaceRoute(pathname: string): boolean {
  return OPERATOR_REVIEW_WORKSPACE_PATH_PATTERN.test(pathname);
}

function shouldSkipShellStatusForColdSharedReviewQuery(searchParams: URLSearchParams | null): boolean {
  if (searchParams === null) {
    return false;
  }

  return (
    searchParams.get("readOnly") === "1" ||
    searchParams.get("shared") === "1" ||
    searchParams.get("fromShare") === "1"
  );
}

/** True when deferred shell status queries should run for the current operator route. */
export function shouldFetchOperatorShellStatusOnRoute(
  pathname: string | null | undefined,
  searchParams?: URLSearchParams | ReadonlyURLSearchParams | string | null,
): boolean {
  if (pathname === null || pathname === undefined || pathname.length === 0) {
    return true;
  }

  const normalized = normalizeOperatorRoutePathname(pathname);
  const resolvedSearchParams = resolveOperatorRouteSearchParams(searchParams);

  for (const prefix of OPERATOR_SHELL_STATUS_READONLY_ROUTE_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  if (isOperatorReviewWorkspaceRoute(normalized) && shouldSkipShellStatusForColdSharedReviewQuery(resolvedSearchParams)) {
    return false;
  }

  return true;
}
