"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";

import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { FilterChip } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  CUSTOMER_GLOSSARY_ALL_TERMS_FILTER,
  CUSTOMER_GLOSSARY_DEPRECATED_LABEL,
  CUSTOMER_GLOSSARY_EMPTY_STATE,
  CUSTOMER_GLOSSARY_FEATURED_TERMS_LABEL,
  CUSTOMER_GLOSSARY_RELATED_TERMS_LABEL,
  CUSTOMER_GLOSSARY_SEARCH_BROWSE_HEADING,
  CUSTOMER_GLOSSARY_SEARCH_LABEL,
  CUSTOMER_GLOSSARY_SEARCH_PLACEHOLDER,
} from "@/lib/customer-glossary-copy";
import {
  buildGlossaryTermLabelIndex,
  CUSTOMER_GLOSSARY_CATEGORY_LABELS,
  CUSTOMER_GLOSSARY_CATEGORY_ORDER,
  filterGlossaryTermsByQuery,
  glossaryTermsForCategory,
  lettersWithGlossaryTerms,
  listCustomerFacingGlossaryTerms,
  type CustomerGlossaryCategoryId,
  type CustomerGlossaryTerm,
} from "@/lib/customer-glossary-manifest";
import { LOAD_BEARING_GLOSSARY_NOUN_IDS } from "@/lib/load-bearing-glossary-nouns";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

const CUSTOMER_TERMS = listCustomerFacingGlossaryTerms();
const TERM_LABEL_INDEX = buildGlossaryTermLabelIndex(CUSTOMER_TERMS);

const GLOSSARY_FEATURED_TERM_IDS = LOAD_BEARING_GLOSSARY_NOUN_IDS;

const FILTER_CHIP_CLASS = "min-h-8 px-3";

type CategoryFilter = CustomerGlossaryCategoryId | "all";

type GlossaryTermEntryProps = {
  readonly term: CustomerGlossaryTerm;
  readonly visibleTermIds: ReadonlySet<string>;
  readonly onRelatedTermNavigate: (relatedId: string) => void;
};

function GlossaryTermEntry(props: GlossaryTermEntryProps): React.ReactElement {
  return (
    <article
      id={`term-${props.term.id}`}
      className={cn(
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        "scroll-mt-24 border-b border-neutral-200 py-4 last:border-b-0 dark:border-neutral-800",
      )}
      data-testid={`glossary-term-${props.term.id}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.term.label}</h3>
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {CUSTOMER_GLOSSARY_CATEGORY_LABELS[props.term.category]}
        </span>
      </div>
      <p className={cn("m-0 mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.term.definition}</p>
      {props.term.deprecatedAliases !== undefined && props.term.deprecatedAliases.length > 0 ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CUSTOMER_GLOSSARY_DEPRECATED_LABEL}: {props.term.deprecatedAliases.join(", ")}
        </p>
      ) : null}
      {props.term.detail !== undefined ? (
        <details className="mt-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <summary className="cursor-pointer font-medium">More detail</summary>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.term.detail}</p>
        </details>
      ) : null}
      {props.term.relatedTermIds !== undefined && props.term.relatedTermIds.length > 0 ? (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CUSTOMER_GLOSSARY_RELATED_TERMS_LABEL}:{" "}
          {props.term.relatedTermIds.map((relatedId, index) => {
            const label = TERM_LABEL_INDEX[relatedId] ?? relatedId;
            const isVisible = props.visibleTermIds.has(relatedId);

            return (
              <span key={relatedId}>
                {index > 0 ? ", " : ""}
                {isVisible ? (
                  <Link href={`#term-${relatedId}`} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                    {label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={OPERATOR_BODY_INLINE_LINK_CLASS}
                    onClick={() => props.onRelatedTermNavigate(relatedId)}
                  >
                    {label}
                  </button>
                )}
              </span>
            );
          })}
        </p>
      ) : null}
    </article>
  );
}

export function HelpGlossaryPageClient(): React.ReactElement {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filteredTerms = useMemo(() => {
    const categoryTerms = glossaryTermsForCategory(CUSTOMER_TERMS, category);

    return filterGlossaryTermsByQuery(categoryTerms, query, TERM_LABEL_INDEX);
  }, [category, query]);

  const visibleTermIds = useMemo(() => new Set(filteredTerms.map((term) => term.id)), [filteredTerms]);

  const availableLetters = useMemo(() => lettersWithGlossaryTerms(filteredTerms), [filteredTerms]);

  const groupedByCategory = useMemo(() => {
    if (category !== "all") {
      return [{ categoryId: category, terms: filteredTerms }];
    }

    return CUSTOMER_GLOSSARY_CATEGORY_ORDER.map((categoryId) => ({
      categoryId,
      terms: filteredTerms.filter((term) => term.category === categoryId),
    })).filter((group) => group.terms.length > 0);
  }, [category, filteredTerms]);

  const tocHeadings = useMemo((): readonly HelpMarkdownHeading[] => {
    return [
      { id: "glossary-search", title: CUSTOMER_GLOSSARY_SEARCH_BROWSE_HEADING, level: 2 },
      ...groupedByCategory.map((group) => ({
        id: `category-${group.categoryId}`,
        title: CUSTOMER_GLOSSARY_CATEGORY_LABELS[group.categoryId],
        level: 2 as const,
      })),
    ];
  }, [groupedByCategory]);

  const handleRelatedTermNavigate = useCallback((relatedId: string) => {
    setQuery("");
    setCategory("all");

    requestAnimationFrame(() => {
      const target = document.getElementById(`term-${relatedId}`);

      if (target === null) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#term-${relatedId}`);
    });
  }, []);

  return (
    <div className={HELP_PAGE_LAYOUT.contentGrid}>
      <div className="min-w-0 space-y-8" data-testid="help-glossary-primary">
        <section id="glossary-search" className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24 space-y-4")}>
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{CUSTOMER_GLOSSARY_SEARCH_BROWSE_HEADING}</h2>
          <div className="space-y-2" data-testid="glossary-featured-terms">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
              {CUSTOMER_GLOSSARY_FEATURED_TERMS_LABEL}
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {GLOSSARY_FEATURED_TERM_IDS.map((termId) => {
                const label = TERM_LABEL_INDEX[termId] ?? termId;

                return (
                  <li key={termId}>
                    <FilterChip
                      className={cn(buyerFilterChipClass(false, false), FILTER_CHIP_CLASS)}
                      onClick={() => handleRelatedTermNavigate(termId)}
                    >
                      {label}
                    </FilterChip>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-2">
            <label htmlFor="glossary-search-input" className={cn("font-medium", OPERATOR_TYPOGRAPHY.label)}>
              {CUSTOMER_GLOSSARY_SEARCH_LABEL}
            </label>
            <Input
              id="glossary-search-input"
              data-testid="glossary-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={CUSTOMER_GLOSSARY_SEARCH_PLACEHOLDER}
            />
          </div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status" aria-live="polite">
            {filteredTerms.length} {filteredTerms.length === 1 ? "term" : "terms"}
          </p>
          <div className="flex flex-wrap gap-2" data-testid="glossary-category-filters" role="group" aria-label="Glossary categories">
            <FilterChip
              className={cn(buyerFilterChipClass(category === "all", false), FILTER_CHIP_CLASS)}
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              {CUSTOMER_GLOSSARY_ALL_TERMS_FILTER}
            </FilterChip>
            {CUSTOMER_GLOSSARY_CATEGORY_ORDER.map((categoryId) => (
              <FilterChip
                key={categoryId}
                className={cn(buyerFilterChipClass(category === categoryId, false), FILTER_CHIP_CLASS)}
                aria-pressed={category === categoryId}
                onClick={() => setCategory(categoryId)}
              >
                {CUSTOMER_GLOSSARY_CATEGORY_LABELS[categoryId]}
              </FilterChip>
            ))}
          </div>
          {availableLetters.length > 0 ? (
            <nav aria-label="Alphabetical glossary index" data-testid="glossary-letter-index">
              <p className={cn("m-0 mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Terms are grouped by category below. Jump to a letter:
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {availableLetters.map((letter) => {
                  const firstTerm = filteredTerms.find((term) => term.label.toUpperCase().startsWith(letter));

                  if (firstTerm === undefined) {
                    return null;
                  }

                  return (
                    <li key={letter}>
                      <FilterChip
                        href={`#term-${firstTerm.id}`}
                        className={cn(buyerFilterChipClass(false, false), FILTER_CHIP_CLASS)}
                        aria-label={`Jump to terms starting with ${letter}`}
                      >
                        {letter}
                      </FilterChip>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </section>

        {filteredTerms.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="glossary-empty-state">
            {CUSTOMER_GLOSSARY_EMPTY_STATE}
          </p>
        ) : (
          groupedByCategory.map((group) => (
            <section
              key={group.categoryId}
              id={`category-${group.categoryId}`}
              className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24")}
              aria-labelledby={`category-${group.categoryId}-heading`}
            >
              <h2 id={`category-${group.categoryId}-heading`} className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {CUSTOMER_GLOSSARY_CATEGORY_LABELS[group.categoryId]}
              </h2>
              <div className="mt-3">
                {group.terms.map((term) => (
                  <GlossaryTermEntry
                    key={term.id}
                    term={term}
                    visibleTermIds={visibleTermIds}
                    onRelatedTermNavigate={handleRelatedTermNavigate}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <HelpTopicTableOfContents headings={tocHeadings} enableScrollSpy />
    </div>
  );
}
