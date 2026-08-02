import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Button } from "@/components/ui/button";
import { BUYER_OUTCOME_LED_VALUE_PROPOSITION } from "@/lib/buyer-polish-copy";
import {
  MARKETING_CAPTION_TEXT_CLASS,
  MARKETING_LAYOUT,
  MARKETING_MOTION,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { WELCOME_SEE_IT_CTA_LABEL } from "@/components/marketing/welcome-marketing-copy";
import {
  MARKETING_SEE_IT_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

import { SeeItDeliverablePreview } from "./SeeItDeliverablePreview";
import { loadSeeItDemoPreview } from "./load-see-it-demo-preview";
import { normalizeSeeItMarketingPayload } from "./normalize-see-it-payload";
import { SeeItMarketingBody } from "./SeeItMarketingBody";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `ArchLucid · ${WELCOME_SEE_IT_CTA_LABEL}`,
  description: MARKETING_SEE_IT_OG_DESCRIPTION,
  ...buildMarketingSocialMetadata(WELCOME_SEE_IT_CTA_LABEL, MARKETING_SEE_IT_OG_DESCRIPTION, "/see-it"),
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
            See a finalized sample review
          </h1>
          <p
            className={cn("mt-4 max-w-2xl", MARKETING_TYPOGRAPHY.lead)}
            data-testid="see-it-outcome-led-lead"
          >
            {BUYER_OUTCOME_LED_VALUE_PROPOSITION}
          </p>
          <p className={cn("mt-3 max-w-2xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Inspect a read-only healthcare claims package — signed review record, findings, artifacts, and
            audit trail — before you create an account.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild variant="primary" size="lg" data-testid="see-it-cta-showcase">
              <Link href={CANONICAL_ANONYMOUS_PROOF_HREF}>Open interactive sample review</Link>
            </Button>
            <p className={cn("m-0", MARKETING_TYPOGRAPHY.meta, MARKETING_CAPTION_TEXT_CLASS)}>
              No sign-in · healthcare claims sample
            </p>
          </div>
          <p className={cn("mt-4", MARKETING_TYPOGRAPHY.meta)}>
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

      <div
        className={cn(MARKETING_LAYOUT.majorSectionGap, "border-t border-neutral-200 pt-10 dark:border-neutral-800")}
        data-testid="see-it-sample-transition"
      >
        <p className={cn("m-0", MARKETING_TYPOGRAPHY.eyebrow)}>Sample review preview</p>
        <p className={cn("mt-2 m-0 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Below is the evaluation slice for this sample — the same proof shape buyers use on the executive
          summary and review pages.
        </p>
        <div className="mt-6">
          <SeeItMarketingBody source={source} payload={normalized} />
        </div>
      </div>
    </MarketingPageShell>
  );
}
