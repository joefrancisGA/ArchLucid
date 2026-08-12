import type { Metadata } from "next";

import { ExampleRoiBulletinPageBody } from "@/components/marketing/ExampleRoiBulletinPageBody";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import {
  adminRoiBulletinPreviewHref,
  illustrativeQuarterLabelFromSample,
} from "@/lib/marketing/example-roi-bulletin-honesty";
import { loadSampleAggregateRoiBulletinSyntheticMarkdown } from "@/marketing/load-sample-aggregate-roi-bulletin-synthetic";

export const revalidate = 300;

// TB-1520: noindex until buyer-facing CTA rewrite (TB-1518) lands — avoids SERP contributor-path leakage.
export const metadata: Metadata = {
  title: "ArchLucid · Example aggregate ROI bulletin (synthetic)",
  description:
    "Illustrative aggregate baseline bulletin shape for procurement — not production data; real publication gates on operator admin preview with minTenants.",
  robots: { index: false, follow: true },
};

export default function ExampleRoiBulletinMarketingPage() {
  const markdown = loadSampleAggregateRoiBulletinSyntheticMarkdown();
  const illustrativeQuarter = illustrativeQuarterLabelFromSample(markdown);
  const operatorAdminPreviewHref = adminRoiBulletinPreviewHref(illustrativeQuarter);

  return (
    <MarketingPageShell variant="reading" data-testid="example-roi-bulletin-page">
      <ExampleRoiBulletinPageBody
        illustrativeQuarter={illustrativeQuarter}
        markdown={markdown}
        operatorAdminPreviewHref={operatorAdminPreviewHref}
      />
    </MarketingPageShell>
  );
}
