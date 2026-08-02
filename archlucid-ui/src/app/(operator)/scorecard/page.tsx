import { permanentRedirect } from "next/navigation";

import { buildScorecardRedirectPath } from "@/lib/legacy-scorecard-redirect";

type LegacyArchitectureScorecardRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy architecture scorecard URL — permanently redirects to canonical sponsor report scorecard. */
export default async function LegacyArchitectureScorecardRedirectPage(
  props: LegacyArchitectureScorecardRedirectPageProps,
): Promise<never> {
  const searchParams = await props.searchParams;

  permanentRedirect(buildScorecardRedirectPath(searchParams));
}
