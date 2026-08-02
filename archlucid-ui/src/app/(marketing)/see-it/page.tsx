import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingProofChainStrip } from "@/components/marketing/MarketingProofChainStrip";
import { Button } from "@/components/ui/button";
import { BUYER_OUTCOME_LED_VALUE_PROPOSITION } from "@/lib/buyer-polish-copy";
import { MARKETING_CAPTION_TEXT_CLASS, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { WELCOME_SEE_IT_CTA_LABEL } from "@/components/marketing/welcome-marketing-copy";
import {
  MARKETING_SEE_IT_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

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
    <MarketingPageShell variant="reading" className={MARKETING_MOTION.revealIn}>
      <h1 className={MARKETING_TYPOGRAPHY.heroTitle}>See a finalized sample review</h1>
      <p className={cn("mt-4 max-w-3xl", MARKETING_TYPOGRAPHY.lead)} data-testid="see-it-outcome-led-lead">
        {BUYER_OUTCOME_LED_VALUE_PROPOSITION}
      </p>
      <div className="mt-8">
        <MarketingProofChainStrip />
      </div>
      <p className={cn("mt-4", MARKETING_TYPOGRAPHY.meta)}>
        Sample data.{" "}
        <Link className="text-teal-800 underline underline-offset-2 dark:text-teal-200" href="/WORKED_EXAMPLE_ROI.pdf">
          See worked example ROI (PDF)
        </Link>
        .
      </p>

      <div className={cn(MARKETING_SURFACES.sectionPanel, "mt-8")}>
        <p className={cn("m-0", MARKETING_TYPOGRAPHY.cardTitle)}>
          Continue with a full sample review — no sign-in
        </p>
        <p className={cn("mt-2 m-0", MARKETING_TYPOGRAPHY.body, MARKETING_CAPTION_TEXT_CLASS)}>
          Open the read-only demo walkthrough with manifest, audit trail, and artifacts — the same projection buyers use
          on the executive summary and review pages.
        </p>
        <div className="mt-4">
          <Button asChild variant="primary" data-testid="see-it-cta-showcase">
            <Link href={CANONICAL_ANONYMOUS_PROOF_HREF}>Open healthcare claims sample review</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <SeeItMarketingBody source={source} payload={normalized} />
      </div>
    </MarketingPageShell>
  );
}
