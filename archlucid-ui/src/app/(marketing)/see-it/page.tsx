import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SeeItEvidenceOrientationStrip } from "@/components/marketing/SeeItEvidenceOrientationStrip";
import { Button } from "@/components/ui/button";
import {
  MARKETING_CAPTION_TEXT_CLASS,
  MARKETING_LAYOUT,
  MARKETING_MOTION,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  MARKETING_SEE_IT_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import {
  SEE_IT_PAGE_METADATA_TITLE,
  SEE_IT_PAGE_TITLE,
  SEE_IT_GUIDED_WALKTHROUGH_HREF,
} from "@/lib/see-it-page-copy";
import {
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_ARIA,
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_LINK,
} from "@/lib/live-demo-see-it-ladder-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

import { SeeItDeliverablePreview } from "./SeeItDeliverablePreview";
import { loadSeeItDemoPreview } from "./load-see-it-demo-preview";
import { normalizeSeeItMarketingPayload } from "./normalize-see-it-payload";
import { SeeItMarketingBody } from "./SeeItMarketingBody";

/** Shorter than the shared outcome-led line — hero visuals carry the rest. */
const SEE_IT_HERO_LEAD =
  "Evidence-backed proof export — signed review record, findings, and audit trail — not a chat transcript.";

export const revalidate = 300;

export const metadata: Metadata = {
  title: SEE_IT_PAGE_METADATA_TITLE,
  description: MARKETING_SEE_IT_OG_DESCRIPTION,
  ...buildMarketingSocialMetadata(SEE_IT_PAGE_TITLE, MARKETING_SEE_IT_OG_DESCRIPTION, "/see-it"),
  robots: { index: true, follow: true },
  other: {
    "data-demo": "true",
  },
};

export default async function SeeItMarketingPage() {
  const { source, payload } = await loadSeeItDemoPreview();
  const normalized = normalizeSeeItMarketingPayload(payload);

  return (
    <MarketingPageShell variant="default" className={MARKETING_MOTION.revealIn}>
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
          <p className={cn("mt-2", MARKETING_TYPOGRAPHY.meta)}>
            Sample data.{" "}
            <Link
              className="text-teal-800 underline underline-offset-2 dark:text-teal-200"
              href="/WORKED_EXAMPLE_ROI.pdf"
            >
              See worked example ROI (PDF)
            </Link>
            .
          </p>
        </div>

        <SeeItDeliverablePreview />
      </section>

      <SeeItEvidenceOrientationStrip />

      <div
        className={cn(
          MARKETING_LAYOUT.majorSectionGap,
          "mt-14 border-t border-neutral-200 pt-12 dark:border-neutral-800",
        )}
        data-testid="see-it-sample-transition"
      >
        <p className={cn("m-0", MARKETING_TYPOGRAPHY.eyebrow)}>Sample review preview</p>
        <p className={cn("mt-2 m-0 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Evaluation slice for this sample — the same proof shape buyers use on executive summary and review
          pages.
        </p>
        <div className="mt-8">
          <SeeItMarketingBody source={source} payload={normalized} />
        </div>
      </div>
    </MarketingPageShell>
  );
}
