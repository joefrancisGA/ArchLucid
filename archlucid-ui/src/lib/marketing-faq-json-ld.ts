import { MARKETING_FAQ_ITEMS, type MarketingFaqItem } from "@/lib/marketing-faq";

/**
 * FAQPage JSON-LD for /faq (TB-254). No aggregateRating or reviewCount.
 */
export function buildFaqPageLd(siteOrigin: string, items: ReadonlyArray<MarketingFaqItem> = MARKETING_FAQ_ITEMS): Record<string, unknown> {
  const origin = siteOrigin.endsWith("/") ? siteOrigin.slice(0, -1) : siteOrigin;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: `${origin}/faq`,
  };
}
