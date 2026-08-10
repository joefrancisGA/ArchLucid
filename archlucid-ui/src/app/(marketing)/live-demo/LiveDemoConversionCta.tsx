import { Button } from "@/components/ui/button";
import {
  LIVE_DEMO_CTA_CLOSING,
  LIVE_DEMO_CTA_EXPLORE,
  LIVE_DEMO_CTA_PRIMARY,
  LIVE_DEMO_CTA_SECONDARY,
} from "@/lib/live-demo-page-copy";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

type LiveDemoConversionCtaProps = {
  readonly runId: string;
  readonly manifestId: string | null;
  readonly operatorDeepLinksAvailable: boolean;
};

export function LiveDemoConversionCta(props: LiveDemoConversionCtaProps) {
  const fullReviewHref = resolveLiveDemoInspectHref(
    "full-review",
    props.runId,
    props.manifestId,
    props.operatorDeepLinksAvailable,
  );

  return (
    <section
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50"
      data-testid="live-demo-conversion-cta"
      aria-labelledby="live-demo-conversion-heading"
    >
      <h2
        id="live-demo-conversion-heading"
        className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
      >
        Ready to evaluate ArchLucid?
      </h2>
      <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {LIVE_DEMO_CTA_CLOSING}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="primary" data-testid="live-demo-cta-evaluation">
          <LiveDemoTrackedLink href="/get-started" trackKind="conversion" trackValue="evaluation">
            {LIVE_DEMO_CTA_PRIMARY}
          </LiveDemoTrackedLink>
        </Button>
        <Button asChild variant="outline" data-testid="live-demo-cta-enterprise">
          <LiveDemoTrackedLink
            href="/pricing#pricing-quote-request"
            trackKind="conversion"
            trackValue="enterprise-demo"
          >
            {LIVE_DEMO_CTA_SECONDARY}
          </LiveDemoTrackedLink>
        </Button>
        <Button asChild variant="outline" data-testid="live-demo-cta-explore">
          <LiveDemoTrackedLink href={fullReviewHref} trackKind="conversion" trackValue="full-review">
            {LIVE_DEMO_CTA_EXPLORE}
          </LiveDemoTrackedLink>
        </Button>
      </div>
    </section>
  );
}
