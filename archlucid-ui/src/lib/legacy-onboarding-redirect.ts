import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";
import { LEGACY_ONBOARDING_START_PATH } from "@/lib/legacy-onboarding-start-route";

/**
 * Builds the canonical First review guide path plus the same query string as an incoming
 * legacy onboarding route (`/getting-started`, {@link LEGACY_ONBOARDING_START_PATH},
 * {@link LEGACY_ONBOARD_PATH}, `/onboarding`) so bookmarks and handoffs keep deep-link params.
 */
export function buildOnboardingRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = FIRST_REVIEW_GUIDE_PATH;

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) for (const v of value) u.searchParams.append(key, v);
    else u.searchParams.set(key, value);
  }

  return `${u.pathname}${u.search}`;
}
