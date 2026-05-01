import { permanentRedirect } from "next/navigation";

import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";

type OnboardingStartRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Preserves query (e.g. `source=registration` from handoff) while moving to the canonical onboarding page.
 * @deprecated Bookmarks to `/onboarding/start` still work.
 */
export default async function OnboardingStartRedirectPage({ searchParams }: OnboardingStartRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildOnboardingRedirectPath(resolved));
}
