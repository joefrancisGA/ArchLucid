import { LEGACY_LOGIN_PATH } from "@/lib/legacy-login-route";

/**
 * Builds `/auth/signin` plus the same query string as the incoming legacy {@link LEGACY_LOGIN_PATH} shim
 * so bookmarks and handoffs keep deep-link params, including repeated keys.
 */
export function buildLoginRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = "/auth/signin";

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
