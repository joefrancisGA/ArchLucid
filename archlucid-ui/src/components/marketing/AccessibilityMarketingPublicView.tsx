import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { AccessibilityMarketingClaimOrientationStrip } from "@/components/marketing/AccessibilityMarketingClaimOrientationStrip";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { AccessibilityAtGlanceSummary } from "@/components/marketing/accessibility/AccessibilityAtGlanceSummary";
import { AccessibilityRevisionHistory } from "@/components/marketing/accessibility/AccessibilityRevisionHistory";
import {
  ACCESSIBILITY_PUBLIC_BASICS,
  ACCESSIBILITY_PUBLIC_CURRENT_STATUS,
  ACCESSIBILITY_PUBLIC_INTRO,
  ACCESSIBILITY_PUBLIC_KNOWN_LIMITATIONS,
  ACCESSIBILITY_PUBLIC_REVIEW_CADENCE,
  ACCESSIBILITY_PUBLIC_STANDARD,
  ACCESSIBILITY_PUBLIC_VPAT,
  ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_AREAS,
  ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_SUMMARY,
} from "@/lib/accessibility-marketing-public-statement";
import {
  ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID,
  ACCESSIBILITY_MARKETING_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ACCESSIBILITY_MARKETING_MAIN_ID,
  ACCESSIBILITY_MARKETING_PRIMARY_CONTENT_ID,
  ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL,
  ACCESSIBILITY_MARKETING_SKIP_TARGET_ID,
  ACCESSIBILITY_MARKETING_START_HERE_CARD_TITLE,
} from "@/lib/accessibility-marketing-page-copy";
import { ACCESSIBILITY_REVISION_HISTORY } from "@/lib/accessibility-marketing-revision-history";
import { ACCESSIBILITY_PUBLIC_LAYOUT } from "@/lib/accessibility-public-layout";
import { ACCESSIBILITY_CLAIM_DISCIPLINE } from "@/lib/accessibility-evidence-copy";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

const ACCESSIBILITY_REPORT_EMAIL = "accessibility@archlucid.net";

type AccessibilityMarketingPublicViewProps = {
  lastReviewedLine: string | null;
};

function sectionHeading(id: string, title: string): ReactNode {
  return (
    <h2
      id={id}
      className={cn("font-semibold tracking-tight text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}
    >
      {title}
    </h2>
  );
}

/**
 * Public WCAG accessibility statement for marketing — buyer/procurement appropriate; no engineering internals.
 */
export function AccessibilityMarketingPublicView(props: AccessibilityMarketingPublicViewProps): ReactNode {
  return (
    <MarketingPageShell variant="trust" className="space-y-10">
      <a href={`#${ACCESSIBILITY_MARKETING_SKIP_TARGET_ID}`} className={ACCESSIBILITY_PUBLIC_LAYOUT.skipLink}>
        {ACCESSIBILITY_MARKETING_SKIP_LINK_LABEL}
      </a>

      <div
        id={ACCESSIBILITY_MARKETING_PRIMARY_CONTENT_ID}
        data-testid={ACCESSIBILITY_MARKETING_PRIMARY_CONTENT_ID}
        className="space-y-10"
      >
        <header className={ACCESSIBILITY_PUBLIC_LAYOUT.header}>
          <h1 className={ACCESSIBILITY_PUBLIC_LAYOUT.title}>Accessibility</h1>
          <p className={ACCESSIBILITY_PUBLIC_LAYOUT.lede}>{ACCESSIBILITY_PUBLIC_INTRO}</p>
          <p
            className={cn("m-0 mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}
            data-testid={ACCESSIBILITY_MARKETING_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          >
            {ACCESSIBILITY_CLAIM_DISCIPLINE}
          </p>
          <div className={ACCESSIBILITY_PUBLIC_LAYOUT.metaRow}>
            {props.lastReviewedLine !== null ? (
              <span className={ACCESSIBILITY_PUBLIC_LAYOUT.lastReviewed}>{props.lastReviewedLine}</span>
            ) : (
              <span className={ACCESSIBILITY_PUBLIC_LAYOUT.metaSecondary}>
                Last reviewed: (missing — update ACCESSIBILITY.md)
              </span>
            )}
            <span className={ACCESSIBILITY_PUBLIC_LAYOUT.metaSecondary}>Review cadence: annual and after material changes</span>
          </div>
        </header>

        <div id={ACCESSIBILITY_MARKETING_MAIN_ID} tabIndex={-1}>
          <div
            id={ACCESSIBILITY_MARKETING_SKIP_TARGET_ID}
            data-testid={ACCESSIBILITY_MARKETING_FIRST_VIEWPORT_TEST_ID}
            className="space-y-6 border-b border-neutral-200 pb-8 dark:border-neutral-800"
          >
            <AccessibilityAtGlanceSummary />

            <section
              className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="accessibility-start-here-card"
              aria-labelledby="accessibility-start-here-heading"
            >
              <h2
                id="accessibility-start-here-heading"
                className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}
              >
                {ACCESSIBILITY_MARKETING_START_HERE_CARD_TITLE}
              </h2>
              <a
                className={ACCESSIBILITY_PUBLIC_LAYOUT.utilityButton}
                href={`mailto:${ACCESSIBILITY_REPORT_EMAIL}`}
                data-testid="accessibility-report-issue-cta"
              >
                Report an accessibility issue
              </a>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                Email {ACCESSIBILITY_REPORT_EMAIL} with the page, assistive technology or browser, and what you were trying to do.
              </p>
            </section>
          </div>

          <div className="mt-8 space-y-10">
            <section aria-labelledby="a11y-standard" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-standard", "Accessibility standard")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_STANDARD}</p>
            </section>

            <section aria-labelledby="a11y-current-status" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-current-status", "Current status")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_CURRENT_STATUS}</p>
            </section>

            <section aria-labelledby="a11y-what-we-test" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-what-we-test", "What we test")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_SUMMARY}</p>
              <ul className={cn("m-0 list-disc space-y-2 pl-5 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                {ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_AREAS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="a11y-basics" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-basics", "Accessibility basics")}
              <ul className={cn("m-0 list-disc space-y-2 pl-5 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                {ACCESSIBILITY_PUBLIC_BASICS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="a11y-known-limitations" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-known-limitations", "Known limitations")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_KNOWN_LIMITATIONS}</p>
            </section>

            <section aria-labelledby="a11y-vpat" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-vpat", "VPAT")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_VPAT}</p>
            </section>

            <section aria-labelledby="a11y-report" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-report", "Reporting an accessibility issue")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>
                If you experience an accessibility barrier while using ArchLucid, email{" "}
                <Link className={MARKETING_SURFACES.inlineLink} href={`mailto:${ACCESSIBILITY_REPORT_EMAIL}`}>
                  {ACCESSIBILITY_REPORT_EMAIL}
                </Link>
                . Please include the page or workflow, the assistive technology or browser you are using, and what you were trying to do.
                Please do not include sensitive customer data.
              </p>
            </section>

            <section aria-labelledby="a11y-review-cadence" className={MARKETING_LAYOUT.sectionStack}>
              {sectionHeading("a11y-review-cadence", "Review cadence")}
              <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_REVIEW_CADENCE}</p>
            </section>

            <AccessibilityRevisionHistory entries={ACCESSIBILITY_REVISION_HISTORY} />

            <div data-testid="accessibility-orientation-bottom">
              <AccessibilityMarketingClaimOrientationStrip />
            </div>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
