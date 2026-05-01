import { permanentRedirect } from "next/navigation";

import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";

type GettingStartedRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** @deprecated Use `/onboarding` — kept for bookmarks. */
export default async function GettingStartedRedirectPage({ searchParams }: GettingStartedRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildOnboardingRedirectPath(resolved));
}
