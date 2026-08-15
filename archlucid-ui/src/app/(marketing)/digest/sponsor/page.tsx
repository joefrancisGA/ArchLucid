import Link from "next/link";

import { ExecDigestSponsorDeepLinkPanel } from "@/app/(marketing)/digest/sponsor/_sections/ExecDigestSponsorDeepLinkPanel";
import { fetchExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ExecDigestSponsorDeepLinkPage(props: PageProps): Promise<React.JSX.Element> {
  const searchParams = await props.searchParams;
  const token = searchParams.token?.trim();

  if (!token) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 px-4 py-10 text-sm text-al-text-secondary">
        <h1 className="text-xl font-semibold text-al-text-primary">Sponsor digest link</h1>
        <p>This read-only link is missing its access token. Open the latest weekly digest email and use the CTA again.</p>
        <p>
          <Link href="/auth/sign-in" className="font-medium text-al-accent hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  const view = await fetchExecDigestSponsorDeepLinkView(token);

  if (!view) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 px-4 py-10 text-sm text-al-text-secondary">
        <h1 className="text-xl font-semibold text-al-text-primary">Sponsor digest link unavailable</h1>
        <p>This read-only digest link is invalid, expired, or no longer available.</p>
        <p>
          <Link href="/auth/sign-in" className="font-medium text-al-accent hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  return <ExecDigestSponsorDeepLinkPanel view={view} />;
}
