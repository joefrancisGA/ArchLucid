import Link from "next/link";

import { DigestSponsorPageChrome } from "@/components/marketing/DigestSponsorPageChrome";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DIGEST_SPONSOR_COLLATERAL_MISSING_TOKEN_BODY,
  DIGEST_SPONSOR_COLLATERAL_MISSING_TOKEN_TITLE,
  DIGEST_SPONSOR_COLLATERAL_UNAVAILABLE_BODY,
  DIGEST_SPONSOR_COLLATERAL_UNAVAILABLE_TITLE,
  DIGEST_SPONSOR_MISSING_TOKEN_BODY,
  DIGEST_SPONSOR_MISSING_TOKEN_TITLE,
  DIGEST_SPONSOR_SIGN_IN_LABEL,
  DIGEST_SPONSOR_UNAVAILABLE_BODY,
  DIGEST_SPONSOR_UNAVAILABLE_TITLE,
} from "@/lib/marketing/digest-sponsor-page-copy";
import { DIGEST_SPONSOR_CANONICAL_PATH } from "@/lib/marketing/digest-sponsor-evidence-copy";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
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
      <DigestSponsorPageChrome
        hero={
          <header className="space-y-2" data-testid="digest-sponsor-issue-hero">
            <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{props.title}</h1>
            <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{props.body}</p>
          </header>
        }
      >
        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link
            className={MARKETING_SURFACES.inlineLink}
            data-testid="digest-sponsor-issue-sign-in"
            href={buildAuthSignInHref({ returnPath: DIGEST_SPONSOR_CANONICAL_PATH })}
          >
            {DIGEST_SPONSOR_SIGN_IN_LABEL}
          </Link>
        </p>
      </DigestSponsorPageChrome>
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

export function ExecDigestSponsorRunCollateralMissingTokenPage(): React.JSX.Element {
  return (
    <ExecDigestSponsorDeepLinkIssuePage
      title={DIGEST_SPONSOR_COLLATERAL_MISSING_TOKEN_TITLE}
      body={DIGEST_SPONSOR_COLLATERAL_MISSING_TOKEN_BODY}
    />
  );
}

export function ExecDigestSponsorRunCollateralUnavailablePage(): React.JSX.Element {
  return (
    <ExecDigestSponsorDeepLinkIssuePage
      title={DIGEST_SPONSOR_COLLATERAL_UNAVAILABLE_TITLE}
      body={DIGEST_SPONSOR_COLLATERAL_UNAVAILABLE_BODY}
    />
  );
}
