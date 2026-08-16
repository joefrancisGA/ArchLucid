import type { Metadata } from "next";

import { ExampleRoiBulletinPageBody } from "@/components/marketing/ExampleRoiBulletinPageBody";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { prepareExampleRoiBulletinMarkdownForBuyer } from "@/lib/marketing/prepare-example-roi-bulletin-markdown";
import {
  adminRoiBulletinPreviewHref,
  illustrativeQuarterLabelFromSample,
  lastReviewedLabelFromSample,
} from "@/lib/marketing/example-roi-bulletin-honesty";
import { loadSampleAggregateRoiBulletinSyntheticMarkdown } from "@/marketing/load-sample-aggregate-roi-bulletin-synthetic";

import { ExampleRoiBulletinMarketingPageChrome } from "./ExampleRoiBulletinMarketingPageChrome";

export const revalidate = 300;

// TB-1520 / TB-1518: indexable after buyer-facing CTA rewrite landed 2026-08-11.
export const metadata: Metadata = {
  title: "ArchLucid · Example aggregate ROI bulletin (synthetic)",
  description:
    "Illustrative aggregate baseline bulletin shape for procurement — not production data; real publication gates on operator admin preview with minTenants.",
  robots: { index: true, follow: true },
};

export default function ExampleRoiBulletinMarketingPage() {
  const sourceMarkdown = loadSampleAggregateRoiBulletinSyntheticMarkdown();
  const buyerMarkdown = prepareExampleRoiBulletinMarkdownForBuyer(sourceMarkdown);
  const illustrativeQuarter = illustrativeQuarterLabelFromSample(sourceMarkdown);
  const lastReviewedLabel = lastReviewedLabelFromSample(sourceMarkdown);
  const operatorAdminPreviewHref = adminRoiBulletinPreviewHref(illustrativeQuarter);

  return (
    <MarketingPageShell variant="reading" data-testid="example-roi-bulletin-page">
      <ExampleRoiBulletinMarketingPageChrome>
        <ExampleRoiBulletinPageBody
          buyerMarkdown={buyerMarkdown}
          sourceMarkdown={sourceMarkdown}
          illustrativeQuarter={illustrativeQuarter}
          lastReviewedLabel={lastReviewedLabel}
          operatorAdminPreviewHref={operatorAdminPreviewHref}
        />
      </ExampleRoiBulletinMarketingPageChrome>
    </MarketingPageShell>
  );
}
