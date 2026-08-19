import { ExecDigestSponsorDeepLinkPanel } from "@/app/(marketing)/digest/sponsor/_sections/ExecDigestSponsorDeepLinkPanel";
import { fetchExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";

import {
  ExecDigestSponsorMissingTokenPage,
  ExecDigestSponsorUnavailablePage,
} from "./_sections/ExecDigestSponsorDeepLinkIssuePage";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ExecDigestSponsorDeepLinkPage(props: PageProps): Promise<React.JSX.Element> {
  const searchParams = await props.searchParams;
  const token = searchParams.token?.trim();

  if (!token) {
    return <ExecDigestSponsorMissingTokenPage />;
  }

  const view = await fetchExecDigestSponsorDeepLinkView(token);

  if (!view) {
    return <ExecDigestSponsorUnavailablePage />;
  }

  return <ExecDigestSponsorDeepLinkPanel view={view} />;
}
