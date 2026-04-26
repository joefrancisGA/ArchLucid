import { permanentRedirect } from "next/navigation";

import { buildGettingStartedRedirectPath } from "@/lib/legacy-onboarding-redirect";

type OnboardingRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** @deprecated Use `/getting-started` — kept for bookmarks. */
export default async function OnboardingRedirectPage({ searchParams }: OnboardingRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildGettingStartedRedirectPath(resolved));
}
