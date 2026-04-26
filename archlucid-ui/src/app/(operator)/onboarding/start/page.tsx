import { permanentRedirect } from "next/navigation";

import { buildGettingStartedRedirectPath } from "@/lib/legacy-onboarding-redirect";

type OnboardingStartRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Preserves query (e.g. `source=registration` from handoff) while moving to the canonical getting-started page.
 * @deprecated Bookmarks to `/onboarding/start` still work.
 */
export default async function OnboardingStartRedirectPage({ searchParams }: OnboardingStartRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildGettingStartedRedirectPath(resolved));
}
