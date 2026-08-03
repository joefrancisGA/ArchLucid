"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MARKETING_FAQ_EMPTY_SEARCH_MESSAGE,
  MARKETING_FAQ_SEARCH_LABEL,
  MARKETING_FAQ_SEARCH_PLACEHOLDER,
  MARKETING_FAQ_SECURITY_TRUST_LINK_LABEL,
  MARKETING_FAQ_VIEW_PRICING_LABEL,
} from "@/lib/marketing/marketing-faq-page-copy";
import {
  filterMarketingFaqItems,
  MARKETING_FAQ_CATEGORIES,
  MARKETING_FAQ_ITEMS,
  marketingFaqItemsByCategory,
} from "@/lib/marketing-faq";

import { FaqEvidenceOrientationStrip } from "./FaqEvidenceOrientationStrip";
import { MarketingFaqCtaRow, MarketingFaqPageHero } from "./MarketingFaqPageHero";

export function MarketingFaqPageClient(): React.JSX.Element {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => filterMarketingFaqItems(MARKETING_FAQ_ITEMS, query), [query]);
  const grouped = useMemo(() => marketingFaqItemsByCategory(filteredItems), [filteredItems]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_12.5rem] lg:items-start">
      <div className="min-w-0">
        <MarketingFaqPageHero />

        <FaqEvidenceOrientationStrip />

        <label className={cn("mt-8 block font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)} htmlFor="marketing-faq-search">
          {MARKETING_FAQ_SEARCH_LABEL}
        </label>
        <input
          id="marketing-faq-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={MARKETING_FAQ_SEARCH_PLACEHOLDER}
          className={cn(
            "mt-2 w-full max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950",
            MARKETING_TYPOGRAPHY.body,
          )}
          autoComplete="off"
          data-testid="marketing-faq-search"
        />

        {grouped.length === 0 ? (
          <p className={cn("mt-8 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)} data-testid="marketing-faq-empty">
            {MARKETING_FAQ_EMPTY_SEARCH_MESSAGE}
          </p>
        ) : (
          <div className="mt-8 space-y-10">
            {grouped.map((group) => (
              <section
                key={group.category.id}
                id={group.category.id}
                aria-labelledby={`marketing-faq-category-${group.category.id}`}
                className="scroll-mt-24"
              >
                <h2 id={`marketing-faq-category-${group.category.id}`} className={MARKETING_TYPOGRAPHY.sectionTitle}>
                  {group.category.title}
                </h2>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <details
                      key={item.id}
                      id={item.id}
                      className="group rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm open:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                      data-testid={`marketing-faq-item-${item.id}`}
                    >
                      <summary
                        className={cn(
                          "cursor-pointer list-none font-medium text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
                          MARKETING_TYPOGRAPHY.cardTitle,
                        )}
                      >
                        {item.question}
                      </summary>
                      <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-10 space-y-4 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <MarketingFaqCtaRow testId="marketing-faq-cta-bottom" />
          <div className={cn("flex flex-wrap gap-x-4 gap-y-2", MARKETING_TYPOGRAPHY.body)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/pricing">
              {MARKETING_FAQ_VIEW_PRICING_LABEL}
            </Link>
            <Link className={MARKETING_SURFACES.inlineLink} href="/security-trust">
              {MARKETING_FAQ_SECURITY_TRUST_LINK_LABEL}
            </Link>
          </div>
        </footer>
      </div>

      <nav
        aria-label="On this page"
        className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto"
        data-testid="marketing-faq-toc"
      >
        <p className={cn("m-0 font-semibold uppercase tracking-wide text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>
          On this page
        </p>
        <ul className="m-0 mt-3 list-none space-y-2 p-0">
          {MARKETING_FAQ_CATEGORIES.map((category) => (
            <li key={category.id}>
              <a className={MARKETING_SURFACES.inlineLink} href={`#${category.id}`}>
                {category.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
