/**
 * Builds `/onboarding` plus the same query string as the incoming legacy onboarding route
 * (`/getting-started`, `/onboarding/start`, `/onboard`) so bookmarks and handoffs keep deep-link params.
 */
export function buildOnboardingRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = "/onboarding";

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) for (const v of value) u.searchParams.append(key, v);
    else u.searchParams.set(key, value);
  }

  return `${u.pathname}${u.search}`;
}
