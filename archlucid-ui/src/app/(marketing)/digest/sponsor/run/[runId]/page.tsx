import { ExecDigestSponsorDeepLinkPanel } from "@/app/(marketing)/digest/sponsor/_sections/ExecDigestSponsorDeepLinkPanel";
import { fetchExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { notFound } from "next/navigation";

import {
  ExecDigestSponsorRunCollateralMissingTokenPage,
  ExecDigestSponsorRunCollateralUnavailablePage,
} from "../../_sections/ExecDigestSponsorDeepLinkIssuePage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ExecDigestSponsorRunDeepLinkPage(props: PageProps): Promise<React.JSX.Element> {
  const [{ runId }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const token = searchParams.token?.trim();
  const normalizedRunId = runId.trim().replace(/-/g, "");

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (!token) {
    return <ExecDigestSponsorRunCollateralMissingTokenPage />;
  }

  const view = await fetchExecDigestSponsorDeepLinkView(token, normalizedRunId);

  if (!view) {
    return <ExecDigestSponsorRunCollateralUnavailablePage />;
  }

  return <ExecDigestSponsorDeepLinkPanel view={view} />;
}
