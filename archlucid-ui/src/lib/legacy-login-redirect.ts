import {
  AUTH_SESSION_EXPIRED_PATH,
  CANONICAL_AUTH_SIGNIN_PATH,
} from "@/lib/legacy-login-route";

function reasonIncludesIdleTimeout(value: string | string[] | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.includes("idle-timeout");
  }

  return value === "idle-timeout";
}

/**
 * Builds `/auth/signin` (or `/auth/session-expired` for idle-timeout) plus the same query
 * string as the incoming legacy `/login` shim so bookmarks keep deep-link params.
 */
export function buildLoginRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = reasonIncludesIdleTimeout(searchParams.reason)
    ? AUTH_SESSION_EXPIRED_PATH
    : CANONICAL_AUTH_SIGNIN_PATH;

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        u.searchParams.append(key, entry);
      }
    } else {
      u.searchParams.set(key, value);
    }
  }

  return `${u.pathname}${u.search}`;
}
