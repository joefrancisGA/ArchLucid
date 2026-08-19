import type { Metadata } from "next";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import {
  MARKETING_LAYOUT,
  MARKETING_MOTION,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  MARKETING_SEE_IT_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import { SEE_IT_PAGE_METADATA_TITLE, SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { cn } from "@/lib/utils";

import { loadSeeItDemoPreview } from "./load-see-it-demo-preview";
import { normalizeSeeItMarketingPayload } from "./normalize-see-it-payload";
import { SeeItMarketingBody } from "./SeeItMarketingBody";
import { SeeItMarketingPageChrome } from "./SeeItMarketingPageChrome";

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
    <MarketingPageShell variant="default" className={MARKETING_MOTION.revealIn} data-testid="see-it-page">
      <SeeItMarketingPageChrome>
        <div
          className={cn(
            MARKETING_LAYOUT.majorSectionGap,
            "border-t border-neutral-200 pt-12 dark:border-neutral-800",
          )}
          data-testid="see-it-sample-transition"
        >
          <p className={cn("m-0", MARKETING_TYPOGRAPHY.eyebrow)}>Sample review preview</p>
          <p className={cn("mt-2 m-0 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Evaluation slice for this sample — the same proof shape buyers use on sponsor report and review
            pages. Open the interactive sample above for the full walkthrough; this section summarizes the
            package from demo preview data.
          </p>

          <div className="mt-8">
            <SeeItMarketingBody source={source} payload={normalized} />
          </div>
        </div>
      </SeeItMarketingPageChrome>
    </MarketingPageShell>
  );
}
