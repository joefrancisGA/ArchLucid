"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MARKETING_FAQ_MOST_ASKED_HEADING,
  MARKETING_FAQ_MOST_ASKED_INTRO,
  MARKETING_FAQ_SECURITY_TRUST_LINK_LABEL,
  MARKETING_FAQ_VIEW_PRICING_LABEL,
} from "@/lib/marketing/marketing-faq-page-copy";
import {
  MARKETING_FAQ_ITEMS,
  marketingFaqItemsByCategory,
  selectMarketingFaqCategoryItems,
  selectMarketingFaqMostAskedItems,
} from "@/lib/marketing-faq";

import { FaqEvidenceOrientationStrip } from "./FaqEvidenceOrientationStrip";
import { MarketingFaqDiligenceCtaSection } from "./MarketingFaqDiligenceCtaSection";
import { MarketingFaqItemPanel } from "./MarketingFaqItemPanel";
import { MarketingFaqCtaRow, MarketingFaqPageHero } from "./MarketingFaqPageHero";
import { MarketingFaqPageToc } from "./MarketingFaqPageToc";

export function MarketingFaqPageClient(): React.JSX.Element {
  const [hashTargetId, setHashTargetId] = useState<string | null>(null);

  const mostAskedItems = useMemo(() => selectMarketingFaqMostAskedItems(MARKETING_FAQ_ITEMS), []);
  // Promoted questions are excluded from their categories so each id renders once.
  const grouped = useMemo(
    () => marketingFaqItemsByCategory(selectMarketingFaqCategoryItems(MARKETING_FAQ_ITEMS)),
    [],
  );
  const visibleCategories = useMemo(() => grouped.map((group) => group.category), [grouped]);

  useEffect(() => {
    function readHashTarget(): void {
      const hashId = window.location.hash.slice(1);

      setHashTargetId(hashId.length > 0 ? hashId : null);
    }

    function openHashTarget(): void {
      const hashId = window.location.hash.slice(1);

      if (hashId.length === 0) {
        return;
      }

      const target = document.getElementById(hashId);

      if (target instanceof HTMLDetailsElement) {
        target.open = true;
      }

      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleHashChange(): void {
      readHashTarget();
      openHashTarget();
    }

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [grouped]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_12.5rem] lg:items-start">
      <div className="min-w-0">
        <MarketingFaqPageHero />

        <FaqEvidenceOrientationStrip part="claim" />

        <section
          aria-labelledby="marketing-faq-most-asked-heading"
          className="mt-8 scroll-mt-24"
          data-testid="marketing-faq-most-asked"
        >
          <h2 id="marketing-faq-most-asked-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            {MARKETING_FAQ_MOST_ASKED_HEADING}
          </h2>
          <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{MARKETING_FAQ_MOST_ASKED_INTRO}</p>
          <div className="mt-4 space-y-3">
            {mostAskedItems.map((item) => (
              <MarketingFaqItemPanel key={item.id} item={item} forceOpen={item.id === hashTargetId} defaultOpen />
        <label className={cn("mt-8 block font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)} htmlFor="marketing-faq-search">
          {MARKETING_FAQ_SEARCH_LABEL}
        </label>
        <Input
          id="marketing-faq-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={MARKETING_FAQ_SEARCH_PLACEHOLDER}
          className="mt-2 max-w-xl"
          autoComplete="off"
          aria-describedby={searchStatusId}
          data-testid="marketing-faq-search"
        />
        <p
          id={searchStatusId}
          role="status"
          aria-live="polite"
          className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}
          data-testid="marketing-faq-search-status"
        >
          {formatMarketingFaqSearchStatus(filteredItems.length, MARKETING_FAQ_ITEMS.length)}
        </p>

        {showMostAsked ? (
          <section
            aria-labelledby="marketing-faq-most-asked-heading"
            className="mt-8 scroll-mt-24"
            data-testid="marketing-faq-most-asked"
          >
            <h2 id="marketing-faq-most-asked-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
              {MARKETING_FAQ_MOST_ASKED_HEADING}
            </h2>
            <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{MARKETING_FAQ_MOST_ASKED_INTRO}</p>
            <div className="mt-4 space-y-3">
              {mostAskedItems.map((item) => (
                <MarketingFaqItemPanel
                  key={item.id}
                  item={item}
                  forceOpen={item.id === hashTargetId}
                  defaultOpen
                />
              ))}
            </div>
          </section>
        ) : null}

        {grouped.length === 0 ? (
          <div className="mt-8 space-y-3" data-testid="marketing-faq-empty">
            <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{MARKETING_FAQ_EMPTY_SEARCH_MESSAGE}</p>
            <button
              type="button"
              className={cn(MARKETING_SURFACES.inlineLink, "bg-transparent p-0")}
              onClick={() => {
                setQuery("");
              }}
            >
              {MARKETING_FAQ_CLEAR_SEARCH_LABEL}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {grouped.map((group) => (
              <section
                key={group.category.id}
                id={group.category.id}
                aria-labelledby={`marketing-faq-category-${group.category.id}`}
                className="scroll-mt-24"
              >
                {group.category.id === "security-trust" && !isSearchActive ? (
                  <div className="mb-6">
                    <MarketingFaqDiligenceCtaSection />
                  </div>
                ) : null}
                <h2 id={`marketing-faq-category-${group.category.id}`} className={MARKETING_TYPOGRAPHY.sectionTitle}>
                  {group.category.title}
                </h2>
                <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{group.category.intro}</p>
                <div className="mt-4 space-y-3">
                  {group.items.map((item, index) => (
                    <MarketingFaqItemPanel
                      key={item.id}
                      item={item}
                      forceOpen={isSearchActive || item.id === hashTargetId}
                      defaultOpen={!isSearchActive && index === 0}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-10">
          {grouped.map((group) => (
            <section
              key={group.category.id}
              id={group.category.id}
              aria-labelledby={`marketing-faq-category-${group.category.id}`}
              className="scroll-mt-24"
            >
              {group.category.id === "security-trust" ? (
                <div className="mb-6">
                  <MarketingFaqDiligenceCtaSection />
                </div>
              ) : null}
              <h2 id={`marketing-faq-category-${group.category.id}`} className={MARKETING_TYPOGRAPHY.sectionTitle}>
                {group.category.title}
              </h2>
              <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{group.category.intro}</p>
              <div className="mt-4 space-y-3">
                {group.items.map((item, index) => (
                  <MarketingFaqItemPanel
                    key={item.id}
                    item={item}
                    forceOpen={item.id === hashTargetId}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <FaqEvidenceOrientationStrip />

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

      <MarketingFaqPageToc categories={visibleCategories} />
    </div>
  );
}
