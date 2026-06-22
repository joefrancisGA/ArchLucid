import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildFaqPageLd } from "@/lib/marketing-faq-json-ld";
import { MARKETING_FAQ_ITEMS } from "@/lib/marketing-faq";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

export const metadata: Metadata = {
  title: "FAQ · ArchLucid",
  description: `Product FAQ for ArchLucid (${BRAND_CATEGORY}) — evidence upload, trials, assurance, and buyer diligence.`,
  robots: { index: true, follow: true },
};

export default function MarketingFaqPage(): ReactNode {
  const faqLd = buildFaqPageLd(getSiteMetadataBaseUrl().origin);

  return (
    <MarketingPageShell variant="reading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Product FAQ</h1>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        Quick answers for visitors evaluating ArchLucid as an {BRAND_CATEGORY} platform.
      </p>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
        <Link className={MARKETING_SURFACES.inlineLink} href="/welcome">
          Back to welcome
        </Link>
      </p>

      {MARKETING_FAQ_ITEMS.map((item) => (
        <section key={item.id} id={item.id} className="mt-10 scroll-mt-20">
          <h2 className={MARKETING_TYPOGRAPHY.sectionTitle}>{item.question}</h2>
          <p className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>{item.answer}</p>
        </section>
      ))}
    </MarketingPageShell>
  );
}
