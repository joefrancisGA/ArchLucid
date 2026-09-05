import Link from "next/link";
import type { JSX } from "react";

import { ArchitectureNarrativeMarkdownView } from "@/components/architecture/ArchitectureNarrativeMarkdownView";
import { DigestSponsorEvidenceOrientationStrip } from "@/components/marketing/DigestSponsorEvidenceOrientationStrip";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";
import {
  DIGEST_SPONSOR_COLLATERAL_TITLE,
  DIGEST_SPONSOR_COMMITTED_PACKAGES_PREFIX,
  DIGEST_SPONSOR_HIGHLIGHTED_REVIEWS_HEADING,
  DIGEST_SPONSOR_LEAD,
  DIGEST_SPONSOR_OVERVIEW_TITLE,
  DIGEST_SPONSOR_PAGE_EYEBROW,
  DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
  DIGEST_SPONSOR_SIGN_IN_WORKSPACE_LABEL,
  DIGEST_SPONSOR_SKIP_LINK_LABEL,
} from "@/lib/marketing/digest-sponsor-page-copy";
import { DIGEST_SPONSOR_CANONICAL_PATH } from "@/lib/marketing/digest-sponsor-evidence-copy";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

type ExecDigestSponsorDeepLinkViewProps = {
  readonly view: ExecDigestSponsorDeepLinkView;
};

function highlightedReviewLabel(caption: string | null | undefined): string {
  const trimmedCaption = caption?.trim() ?? "";

  if (trimmedCaption.length > 0) {
    return trimmedCaption;
  }

  return "Highlighted review";
}

export function ExecDigestSponsorDeepLinkPanel(props: ExecDigestSponsorDeepLinkViewProps): JSX.Element {
  const { view } = props;
  const isRunCollateral = view.target === "run-collateral";
  const pageTitle = isRunCollateral ? DIGEST_SPONSOR_COLLATERAL_TITLE : DIGEST_SPONSOR_OVERVIEW_TITLE;

  return (
    <MarketingPageShell variant="reading" data-testid="digest-sponsor-page">
      <a href={`#${DIGEST_SPONSOR_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {DIGEST_SPONSOR_SKIP_LINK_LABEL}
      </a>
      <div
        className={cn("space-y-6 py-10", MARKETING_LAYOUT.page)}
        id={DIGEST_SPONSOR_PRIMARY_CONTENT_ID}
      >
        <header className="space-y-2 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{DIGEST_SPONSOR_PAGE_EYEBROW}</p>
          <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{pageTitle}</h1>
          <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{view.weekLabel}</p>
          <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{DIGEST_SPONSOR_LEAD}</p>
        </header>

        <div data-testid="digest-sponsor-orientation-top">
          <DigestSponsorEvidenceOrientationStrip />
        </div>

        {isRunCollateral ? (
          <section className="space-y-4" data-testid="exec-digest-sponsor-run-collateral">
            {view.runSummaryMarkdown ? (
              <ArchitectureNarrativeMarkdownView markdown={view.runSummaryMarkdown} />
            ) : (
              <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                No sponsor summary is available for this review.
              </p>
            )}
          </section>
        ) : (
          <section className="space-y-4" data-testid="exec-digest-sponsor-dashboard">
            {view.committedManifestsInWeek != null ? (
              <p className={MARKETING_TYPOGRAPHY.body}>
                {DIGEST_SPONSOR_COMMITTED_PACKAGES_PREFIX}{" "}
                <strong>{view.committedManifestsInWeek}</strong>
              </p>
            ) : null}

            {view.topRuns.length > 0 ? (
              <div className="space-y-2">
                <h2 className={MARKETING_TYPOGRAPHY.sectionTitle}>{DIGEST_SPONSOR_HIGHLIGHTED_REVIEWS_HEADING}</h2>
                <ul className="space-y-2">
                  {view.topRuns.map((run) => (
                    <li
                      key={run.runIdHex}
                      className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                    >
                      <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>
                        {highlightedReviewLabel(run.caption)}
                      </p>
                      <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                        Significance score {run.significanceScore}
                        {run.runIdHex ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono">{run.runIdHex}</span>
                          </>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {view.findingsDeltaSummary ? (
              <p className={MARKETING_TYPOGRAPHY.body}>{view.findingsDeltaSummary}</p>
            ) : null}

            {view.complianceDriftMarkdown ? (
              <ArchitectureNarrativeMarkdownView
                markdown={view.complianceDriftMarkdown}
                tableCaption="Compliance drift"
              />
            ) : null}

            {view.decisionNeededMarkdown ? (
              <ArchitectureNarrativeMarkdownView
                markdown={view.decisionNeededMarkdown}
                tableCaption="Decisions needed"
              />
            ) : null}
          </section>
        )}

        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link
            className={MARKETING_SURFACES.inlineLink}
            href={buildAuthSignInHref({ returnPath: DIGEST_SPONSOR_CANONICAL_PATH })}
          >
            {DIGEST_SPONSOR_SIGN_IN_WORKSPACE_LABEL}
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
