"use client";

import { cn } from "@/lib/utils";
import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";
import { buildGoldenSponsorPackageWalkthroughHref, GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA } from "@/lib/golden-sponsor-package-walkthrough";
import { viewerCanStartReviewFromDemoExplain } from "@/lib/demo-explain-conversion-auth";
import {
  DEMO_EXPLAIN_CONVERSION_ANONYMOUS_HEADING,
  DEMO_EXPLAIN_CONVERSION_ANONYMOUS_LEAD,
  DEMO_EXPLAIN_CONVERSION_AUTHENTICATED_HEADING,
  DEMO_EXPLAIN_CONVERSION_FAB_ANONYMOUS,
  DEMO_EXPLAIN_CONVERSION_FAB_SIGNED_IN,
  DEMO_EXPLAIN_CONVERSION_SEE_IT_HREF,
  DEMO_EXPLAIN_CONVERSION_SEE_IT_SECONDARY,
  DEMO_EXPLAIN_CONVERSION_SIGN_IN_PRIMARY,
  DEMO_EXPLAIN_CONVERSION_START_REVIEW_PRIMARY,
  resolveDemoExplainConversionPrimaryHref,
} from "@/lib/demo-explain-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { Button } from "@/components/ui/button";

/** Re-export for tests that assert the wizard preset href. */
export { DEMO_EXPLAIN_CONVERSION_REVIEW_HREF } from "@/lib/demo-explain-page-copy";

/**
 * Forward CTA on `/demo/explain`: sticky footer on desktop, floating action button on mobile.
 * Anonymous viewers get sign-in honesty instead of implying the wizard opens in-product (TB-1323).
 */
export function DemoExplainConversionCtaCard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const canStartReview = viewerCanStartReviewFromDemoExplain();
  const primaryHref = resolveDemoExplainConversionPrimaryHref(canStartReview);
  const heading = canStartReview
    ? DEMO_EXPLAIN_CONVERSION_AUTHENTICATED_HEADING
    : DEMO_EXPLAIN_CONVERSION_ANONYMOUS_HEADING;
  const lead = canStartReview
    ? CLOUD_NEUTRAL_PRIMARY_COPY.demoExplainConversionLead
    : DEMO_EXPLAIN_CONVERSION_ANONYMOUS_LEAD;
  const primaryLabel = canStartReview
    ? DEMO_EXPLAIN_CONVERSION_START_REVIEW_PRIMARY
    : DEMO_EXPLAIN_CONVERSION_SIGN_IN_PRIMARY;
  const fabLabel = canStartReview ? DEMO_EXPLAIN_CONVERSION_FAB_SIGNED_IN : DEMO_EXPLAIN_CONVERSION_FAB_ANONYMOUS;

  return (
    <>
      <aside
        role="region"
        aria-label="Start your own review"
        data-testid="demo-explain-conversion-cta"
        data-auth-expectation={canStartReview ? "signed-in" : "sign-in-required"}
        className="fixed bottom-0 left-0 right-0 z-40 hidden border-t border-neutral-200/80 bg-neutral-50/95 px-4 py-3 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-neutral-50/85 md:block dark:border-neutral-800/80 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/85"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {heading}
            </p>
            <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {lead}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <InAppHelpLink
              helpSlug="choose-your-next-step"
              label="See what you need first"
              variant="text"
            />
            {canStartReview ? (
              <Button asChild type="button" size="sm" variant="outline">
                <Link
                  href={buildGoldenSponsorPackageWalkthroughHref()}
                  data-testid="demo-explain-conversion-sponsor-walkthrough"
                >
                  {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA}
                </Link>
              </Button>
            ) : (
              <Button asChild type="button" size="sm" variant="outline">
                <Link href={DEMO_EXPLAIN_CONVERSION_SEE_IT_HREF} data-testid="demo-explain-conversion-see-it">
                  {DEMO_EXPLAIN_CONVERSION_SEE_IT_SECONDARY}
                </Link>
              </Button>
            )}
            <Button asChild type="button" size="sm">
              <Link href={primaryHref} data-testid="demo-explain-conversion-primary">
                {primaryLabel}
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      <Button
        asChild
        type="button"
        size="sm"
        className="fixed bottom-5 right-4 z-40 h-11 rounded-full px-4 shadow-lg print:!hidden md:hidden"
        data-testid="demo-explain-conversion-fab"
        data-auth-expectation={canStartReview ? "signed-in" : "sign-in-required"}
      >
        <Link href={primaryHref}>{fabLabel}</Link>
      </Button>
    </>
  );
}
