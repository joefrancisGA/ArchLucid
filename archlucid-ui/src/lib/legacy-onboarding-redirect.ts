import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

/**
 * Builds the canonical First review guide path plus the same query string as an incoming
 * legacy onboarding bookmark (`/onboard`, `/onboarding/start`, `/getting-started`) so a
 * future redirect shim preserves deep-link params.
 */
export function buildOnboardingRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = FIRST_REVIEW_GUIDE_PATH;

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
