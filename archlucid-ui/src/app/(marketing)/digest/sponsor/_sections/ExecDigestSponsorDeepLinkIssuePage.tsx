import Link from "next/link";

import { DigestSponsorEvidenceOrientationStrip } from "@/components/marketing/DigestSponsorEvidenceOrientationStrip";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DIGEST_SPONSOR_MISSING_TOKEN_BODY,
  DIGEST_SPONSOR_MISSING_TOKEN_TITLE,
  DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
  DIGEST_SPONSOR_SIGN_IN_LABEL,
  DIGEST_SPONSOR_SKIP_LINK_LABEL,
  DIGEST_SPONSOR_UNAVAILABLE_BODY,
  DIGEST_SPONSOR_UNAVAILABLE_TITLE,
} from "@/lib/marketing/digest-sponsor-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

export type ExecDigestSponsorDeepLinkIssuePageProps = {
  readonly title: string;
  readonly body: string;
};

/** Token-missing / expired sponsor digest shells share marketing orientation chrome (DIS). */
export function ExecDigestSponsorDeepLinkIssuePage(
  props: ExecDigestSponsorDeepLinkIssuePageProps,
): React.JSX.Element {
  return (
    <MarketingPageShell variant="reading" data-testid="digest-sponsor-issue-page">
      <a href={`#${DIGEST_SPONSOR_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {DIGEST_SPONSOR_SKIP_LINK_LABEL}
      </a>
      <div id={DIGEST_SPONSOR_PRIMARY_CONTENT_ID} className="scroll-mt-24 space-y-6 py-10">
        <div data-testid="digest-sponsor-orientation-top">
          <DigestSponsorEvidenceOrientationStrip />
        </div>
        <header className="space-y-2">
          <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{props.title}</h1>
          <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{props.body}</p>
        </header>
        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link className={MARKETING_SURFACES.inlineLink} href="/auth/signin">
            {DIGEST_SPONSOR_SIGN_IN_LABEL}
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}

export function ExecDigestSponsorMissingTokenPage(): React.JSX.Element {
  return (
    <ExecDigestSponsorDeepLinkIssuePage
      title={DIGEST_SPONSOR_MISSING_TOKEN_TITLE}
      body={DIGEST_SPONSOR_MISSING_TOKEN_BODY}
    />
  );
}

export function ExecDigestSponsorUnavailablePage(): React.JSX.Element {
  return (
    <ExecDigestSponsorDeepLinkIssuePage
      title={DIGEST_SPONSOR_UNAVAILABLE_TITLE}
      body={DIGEST_SPONSOR_UNAVAILABLE_BODY}
    />
  );
}
