import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEMO_PREVIEW_EYEBROW,
  DEMO_PREVIEW_HERO_SUPPORTING,
  DEMO_PREVIEW_HERO_TITLE,
  DEMO_PREVIEW_ILLUSTRATIVE_BADGE,
  DEMO_PREVIEW_ILLUSTRATIVE_DISCLOSURE,
  DEMO_PREVIEW_SAMPLE_SUBTITLE,
  DEMO_PREVIEW_SAMPLE_TITLE,
  DEMO_PREVIEW_SCHEDULE_DEMO_ACTION,
  DEMO_PREVIEW_THIRTY_SECOND_ACTION,
} from "@/lib/demo-preview-page-copy";
import { cn } from "@/lib/utils";

export function DemoPreviewHero() {
  return (
    <header className="space-y-4" data-testid="demo-preview-hero">
      <p className={cn("m-0 font-medium uppercase tracking-wide text-al-text-secondary dark:text-neutral-200", MARKETING_TYPOGRAPHY.eyebrow)}>
        {DEMO_PREVIEW_EYEBROW}
      </p>
      <h1 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.heroTitle)}>
        {DEMO_PREVIEW_HERO_TITLE}
      </h1>
      <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {DEMO_PREVIEW_HERO_SUPPORTING}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_SAMPLE_TITLE}
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.body)}>
            {DEMO_PREVIEW_SAMPLE_SUBTITLE}
          </p>
        </div>
        <Badge variant="secondary" data-testid="demo-preview-illustrative-badge">
          {DEMO_PREVIEW_ILLUSTRATIVE_BADGE}
        </Badge>
      </div>

      <p
        className={cn("m-0 max-w-3xl text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.body)}
        data-testid="demo-preview-illustrative-disclosure"
      >
        {DEMO_PREVIEW_ILLUSTRATIVE_DISCLOSURE}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="primary" data-testid="demo-preview-thirty-second">
          <Link href="/see-it">{DEMO_PREVIEW_THIRTY_SECOND_ACTION}</Link>
        </Button>
        <Link
          href="/pricing#pricing-quote-request"
          className={cn(MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.body)}
          data-testid="demo-preview-schedule-demo-tertiary"
        >
          {DEMO_PREVIEW_SCHEDULE_DEMO_ACTION}
        </Link>
      </div>
    </header>
  );
}
