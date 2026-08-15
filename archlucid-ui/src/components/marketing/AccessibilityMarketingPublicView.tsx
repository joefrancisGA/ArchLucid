import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { AccessibilityEvidenceOrientationStrip } from "@/components/marketing/AccessibilityEvidenceOrientationStrip";
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
import { ACCESSIBILITY_REVISION_HISTORY } from "@/lib/accessibility-marketing-revision-history";
import { ACCESSIBILITY_PUBLIC_LAYOUT } from "@/lib/accessibility-public-layout";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

const ACCESSIBILITY_MAIN_ID = "accessibility-main-content";
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
      <a href={`#${ACCESSIBILITY_MAIN_ID}`} className={ACCESSIBILITY_PUBLIC_LAYOUT.skipLink}>
        Skip to accessibility statement
      </a>

      <div id={ACCESSIBILITY_MAIN_ID} className={ACCESSIBILITY_PUBLIC_LAYOUT.page} tabIndex={-1}>
        <header className={ACCESSIBILITY_PUBLIC_LAYOUT.header}>
          <h1 className={ACCESSIBILITY_PUBLIC_LAYOUT.title}>Accessibility</h1>
          <p className={ACCESSIBILITY_PUBLIC_LAYOUT.lede}>{ACCESSIBILITY_PUBLIC_INTRO}</p>
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
          <div className={ACCESSIBILITY_PUBLIC_LAYOUT.utilities}>
            <a
              className={ACCESSIBILITY_PUBLIC_LAYOUT.utilityButton}
              href={`mailto:${ACCESSIBILITY_REPORT_EMAIL}`}
              data-testid="accessibility-report-issue-cta"
            >
              Report an accessibility issue
            </a>
          </div>
        </header>

        <div className="mt-8 space-y-10">
          <AccessibilityAtGlanceSummary />

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

          <AccessibilityEvidenceOrientationStrip />
        </div>
      </div>
    </MarketingPageShell>
  );
}
