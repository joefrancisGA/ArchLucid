import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MARKETING_CAPTION_TEXT_CLASS,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_ARIA,
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_LINK,
} from "@/lib/live-demo-see-it-ladder-copy";
import { SEE_IT_GUIDED_WALKTHROUGH_HREF, SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

import { SeeItDeliverablePreview } from "./SeeItDeliverablePreview";

/** Shorter than the shared outcome-led line — hero visuals carry the rest. */
export const SEE_IT_HERO_LEAD =
  "Evidence-backed proof export — signed review record, findings, and audit trail — not a chat transcript.";

/** First-viewport hero for `/see-it` — one headline, one lead, one primary CTA, sample preview rail (TB-1281). */
export function SeeItHeroSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="see-it-hero-heading"
      className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12"
      data-testid="see-it-hero"
    >
      <div>
        <h1 id="see-it-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>
          {SEE_IT_PAGE_TITLE}
        </h1>
        <p
          className={cn("mt-4 max-w-xl", MARKETING_TYPOGRAPHY.lead)}
          data-testid="see-it-outcome-led-lead"
        >
          {SEE_IT_HERO_LEAD}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild variant="primary" size="lg" data-testid="see-it-cta-showcase">
            <Link href={CANONICAL_ANONYMOUS_PROOF_HREF}>Open interactive sample review</Link>
          </Button>
          <p className={cn("m-0", MARKETING_TYPOGRAPHY.meta, MARKETING_CAPTION_TEXT_CLASS)}>
            No sign-in · healthcare claims sample
          </p>
        </div>
        <p className={cn("mt-4", MARKETING_TYPOGRAPHY.meta)}>
          <Link
            className="text-teal-800 underline underline-offset-2 dark:text-teal-200"
            href={SEE_IT_GUIDED_WALKTHROUGH_HREF}
            data-testid="see-it-guided-walkthrough-link"
            aria-label={LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_ARIA}
          >
            {LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_LINK}
          </Link>
        </p>
      </div>

      <SeeItDeliverablePreview />
    </section>
  );
}
