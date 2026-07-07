import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import {
  ACCESSIBILITY_PUBLIC_BASICS,
  ACCESSIBILITY_PUBLIC_CURRENT_STATUS,
  ACCESSIBILITY_PUBLIC_INTRO,
  ACCESSIBILITY_PUBLIC_KNOWN_LIMITATIONS,
  ACCESSIBILITY_PUBLIC_REVIEW_CADENCE,
  ACCESSIBILITY_PUBLIC_STANDARD,
  ACCESSIBILITY_PUBLIC_STATUS_CARD,
  ACCESSIBILITY_PUBLIC_VPAT,
  ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_AREAS,
  ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_SUMMARY,
} from "@/lib/accessibility-marketing-public-statement";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
    <MarketingPageShell variant="reading" className="space-y-10">
      <header className="space-y-3">
        <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Accessibility</h1>
        <p className={cn(MARKETING_TYPOGRAPHY.body, "max-w-3xl text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_INTRO}</p>
      </header>

      <section
        aria-labelledby="a11y-status-card"
        className="rounded-xl border border-neutral-200 bg-al-surface-raised p-5 shadow-sm dark:border-neutral-800 sm:p-6"
        data-testid="accessibility-status-card"
      >
        <h2 id="a11y-status-card" className="sr-only">
          Accessibility program summary
        </h2>
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className={cn(MARKETING_TYPOGRAPHY.meta, "font-semibold uppercase tracking-wide text-al-text-secondary")}>
              Target
            </dt>
            <dd className={cn("mt-1 text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>{ACCESSIBILITY_PUBLIC_STATUS_CARD.target}</dd>
          </div>
          <div>
            <dt className={cn(MARKETING_TYPOGRAPHY.meta, "font-semibold uppercase tracking-wide text-al-text-secondary")}>
              Status
            </dt>
            <dd className={cn("mt-1 text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>{ACCESSIBILITY_PUBLIC_STATUS_CARD.status}</dd>
          </div>
          <div>
            <dt className={cn(MARKETING_TYPOGRAPHY.meta, "font-semibold uppercase tracking-wide text-al-text-secondary")}>
              VPAT
            </dt>
            <dd className={cn("mt-1 text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>{ACCESSIBILITY_PUBLIC_STATUS_CARD.vpat}</dd>
          </div>
          <div>
            <dt className={cn(MARKETING_TYPOGRAPHY.meta, "font-semibold uppercase tracking-wide text-al-text-secondary")}>
              Review cadence
            </dt>
            <dd className={cn("mt-1 text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>
              {ACCESSIBILITY_PUBLIC_STATUS_CARD.reviewCadence}
            </dd>
          </div>
        </dl>
      </section>

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
          <Link className={MARKETING_SURFACES.inlineLink} href="mailto:accessibility@archlucid.net">
            accessibility@archlucid.net
          </Link>
          . Please include the page or workflow, the assistive technology or browser you are using, and what you were trying to do.
          Please do not include sensitive customer data.
        </p>
      </section>

      <section aria-labelledby="a11y-review-cadence" className={MARKETING_LAYOUT.sectionStack}>
        {sectionHeading("a11y-review-cadence", "Review cadence")}
        <p className={cn(MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{ACCESSIBILITY_PUBLIC_REVIEW_CADENCE}</p>
      </section>

      <footer
        className={cn(
          "border-t border-neutral-200 pt-6 text-al-text-secondary dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        <p className="m-0">
          {props.lastReviewedLine ?? "Last reviewed: (missing — update ACCESSIBILITY.md)"}. Review cadence: annually and after
          material changes.
        </p>
      </footer>
    </MarketingPageShell>
  );
}
