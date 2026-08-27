import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DEMO_PREVIEW_PUBLIC_SAMPLE_LINK,
  DEMO_PREVIEW_SIGNIN_ACTION,
  DEMO_PREVIEW_SIGNIN_CALLOUT_HEADING,
  DEMO_PREVIEW_SIGNIN_CALLOUT_TEXT,
} from "@/lib/demo-preview-page-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DemoPreviewSignInCallout() {
  return (
    <section
      className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="demo-preview-signin-callout"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {DEMO_PREVIEW_SIGNIN_CALLOUT_HEADING}
      </h2>
      <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {DEMO_PREVIEW_SIGNIN_CALLOUT_TEXT}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" data-testid="demo-preview-signin-cta">
          <Link href="/auth/signin">{DEMO_PREVIEW_SIGNIN_ACTION}</Link>
        </Button>
        <Link
          href="/see-it"
          className={cn("text-sm font-medium text-neutral-600 underline underline-offset-2 dark:text-neutral-400", MARKETING_TYPOGRAPHY.body)}
        >
          {DEMO_PREVIEW_PUBLIC_SAMPLE_LINK}
        </Link>
      </div>
    </section>
  );
}

export function DemoPreviewEvaluationCta() {
  return (
    <section
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50"
      data-testid="demo-preview-signup-cta"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Evaluate ArchLucid with one of your architecture reviews
      </h2>
      <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        Walk through a finalized review using your requirements, evidence sources, policy controls, and approval process.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild variant="primary" data-testid="demo-preview-cta-signup">
          <Link href="/pricing#pricing-quote-request">Schedule enterprise demo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </div>
    </section>
  );
}
