/**
 * Builds `/getting-started` plus the same query string as the incoming legacy onboarding route
 * (`/onboarding`, `/onboarding/start`, `/onboard`) so bookmarks and handoffs keep deep-link params.
 */
export function buildGettingStartedRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = "/getting-started";

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) for (const v of value) u.searchParams.append(key, v);
    else u.searchParams.set(key, value);
  }

  return `${u.pathname}${u.search}`;
}
