import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  LIVE_DEMO_FABRICATED_DISCLOSURE,
  LIVE_DEMO_PAGE_SUBTITLE,
  LIVE_DEMO_PAGE_TITLE,
  LIVE_DEMO_SAMPLE_IDENTITY,
  LIVE_DEMO_SAMPLE_SCENARIO,
  LIVE_DEMO_START_WALKTHROUGH_CTA,
} from "@/lib/live-demo-page-copy";
import {
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF,
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK,
} from "@/lib/live-demo-see-it-ladder-copy";
import { cn } from "@/lib/utils";

/** Above-fold hero — one headline, one line, primary Start (TB-1266). */
export function LiveDemoPageHeader() {
  return (
    <header className="max-w-3xl" data-testid="live-demo-page-header">
      <p className={cn("m-0 text-teal-800 dark:text-teal-300", MARKETING_TYPOGRAPHY.meta)}>Sample walkthrough</p>
      <h1 className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{LIVE_DEMO_PAGE_TITLE}</h1>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {LIVE_DEMO_PAGE_SUBTITLE}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild variant="primary" data-testid="live-demo-start-walkthrough">
          <Link href="/live-demo?step=sponsor">{LIVE_DEMO_START_WALKTHROUGH_CTA}</Link>
        </Button>
        <Link
          className={cn(
            "text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100",
            MARKETING_TYPOGRAPHY.meta,
          )}
          href={LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF}
          data-testid="live-demo-see-it-ladder-link"
        >
          {LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK}
        </Link>
      </div>
    </header>
  );
}

/** Compact sample identity + disclosure beside the stepper (TB-1266). */
export function LiveDemoSampleStatusLine() {
  return (
    <p
      className={cn("m-0 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}
      data-testid="live-demo-sample-status"
      role="status"
    >
      <span className="font-medium text-neutral-800 dark:text-neutral-200">{LIVE_DEMO_SAMPLE_IDENTITY}</span>
      {" · "}
      {LIVE_DEMO_SAMPLE_SCENARIO}
      {" · "}
      {LIVE_DEMO_FABRICATED_DISCLOSURE}
    </p>
  );
}
