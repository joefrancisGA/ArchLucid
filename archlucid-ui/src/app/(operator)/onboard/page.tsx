import { permanentRedirect } from "next/navigation";

import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";

type OnboardRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** @deprecated The canonical onboarding flow is `/onboarding`. */
export default async function OnboardRedirectPage({ searchParams }: OnboardRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildOnboardingRedirectPath(resolved));
}
