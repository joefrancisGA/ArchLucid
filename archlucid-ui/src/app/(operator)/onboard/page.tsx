import { permanentRedirect } from "next/navigation";

import { buildGettingStartedRedirectPath } from "@/lib/legacy-onboarding-redirect";

type OnboardRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** @deprecated The four-step first-session flow lives in New run and run detail; canonical checklist is `/getting-started`. */
export default async function OnboardRedirectPage({ searchParams }: OnboardRedirectPageProps) {
  const resolved = await searchParams;

  permanentRedirect(buildGettingStartedRedirectPath(resolved));
}
