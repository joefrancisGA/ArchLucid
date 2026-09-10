import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingFaqPageClient } from "@/components/marketing/MarketingFaqPageClient";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { buildFaqPageLd, serializeFaqPageLd } from "@/lib/marketing-faq-json-ld";
import {
  MARKETING_FAQ_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

export const metadata: Metadata = {
  title: "Product FAQ · ArchLucid",
  description: `Product FAQ for architects and sponsors evaluating ArchLucid (${BRAND_CATEGORY}) — evaluation, pricing, evidence, approval, and security.`,
  ...buildMarketingSocialMetadata("Product FAQ", MARKETING_FAQ_OG_DESCRIPTION, "/faq"),
  robots: { index: true, follow: true },
};

export default function MarketingFaqPage(): ReactNode {
  const faqLd = buildFaqPageLd(getSiteMetadataBaseUrl().origin);

  return (
    <MarketingPageShell variant="default">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeFaqPageLd(faqLd) }} />
      <MarketingFaqPageClient />
    </MarketingPageShell>
  );
}
