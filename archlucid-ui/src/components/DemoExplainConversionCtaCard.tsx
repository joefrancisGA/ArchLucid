"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { Button } from "@/components/ui/button";

/** Canonical wizard entry for demo viewers graduating to their own review (TB-218 / TB-219). */
export const DEMO_EXPLAIN_CONVERSION_REVIEW_HREF = "/reviews/new?preset=greenfield";

/**
 * Forward CTA on `/demo/explain`: sticky footer on desktop, floating action button on mobile.
 */
export function DemoExplainConversionCtaCard() {
  return (
    <>
      <aside
        role="region"
        aria-label="Start your own review"
        data-testid="demo-explain-conversion-cta"
        className="fixed bottom-0 left-0 right-0 z-40 hidden border-t border-neutral-200/80 bg-neutral-50/95 px-4 py-3 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-neutral-50/85 md:block dark:border-neutral-800/80 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/85"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Ready to run this on your own architecture?
            </p>
            <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              Upload your Azure evidence file to get a review like this in about 15 minutes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <InAppHelpLink
              helpSlug="evaluator-workbook"
              label="See what you need first"
              variant="text"
            />
            <Button asChild type="button" size="sm">
              <Link href={DEMO_EXPLAIN_CONVERSION_REVIEW_HREF} data-testid="demo-explain-conversion-primary">
                Start a new review →
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
      >
        <Link href={DEMO_EXPLAIN_CONVERSION_REVIEW_HREF}>Start your review</Link>
      </Button>
    </>
  );
}
