import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingFaqPageClient } from "@/components/marketing/MarketingFaqPageClient";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { buildFaqPageLd } from "@/lib/marketing-faq-json-ld";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

export const metadata: Metadata = {
  title: "Product FAQ · ArchLucid",
  description: `Product FAQ for architects and sponsors evaluating ArchLucid (${BRAND_CATEGORY}) — evaluation, pricing, evidence, governance, and security.`,
  robots: { index: true, follow: true },
};

export default function MarketingFaqPage(): ReactNode {
  const faqLd = buildFaqPageLd(getSiteMetadataBaseUrl().origin);

  return (
    <MarketingPageShell variant="reading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <MarketingFaqPageClient />
    </MarketingPageShell>
  );
}
