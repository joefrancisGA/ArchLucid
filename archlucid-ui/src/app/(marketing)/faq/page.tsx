import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BRAND_CATEGORY } from "@/lib/brand-category";
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Product FAQ</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        Quick answers for visitors evaluating ArchLucid as an {BRAND_CATEGORY} platform.
      </p>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/welcome">
          Back to welcome
        </Link>
      </p>

      {MARKETING_FAQ_ITEMS.map((item) => (
        <section key={item.id} id={item.id} className="mt-10 scroll-mt-20">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{item.question}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{item.answer}</p>
        </section>
      ))}
    </main>
  );
}
