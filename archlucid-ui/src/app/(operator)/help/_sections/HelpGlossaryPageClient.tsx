"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Input } from "@/components/ui/input";
import {
  CUSTOMER_GLOSSARY_ALL_TERMS_FILTER,
  CUSTOMER_GLOSSARY_DEPRECATED_LABEL,
  CUSTOMER_GLOSSARY_EMPTY_STATE,
  CUSTOMER_GLOSSARY_RELATED_TERMS_LABEL,
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
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { cn } from "@/lib/utils";

const CUSTOMER_TERMS = listCustomerFacingGlossaryTerms();
const TERM_LABEL_INDEX = buildGlossaryTermLabelIndex(CUSTOMER_TERMS);

const GLOSSARY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "glossary-search", title: "Search and browse", level: 2 },
  ...CUSTOMER_GLOSSARY_CATEGORY_ORDER.map((categoryId) => ({
    id: `category-${categoryId}`,
    title: CUSTOMER_GLOSSARY_CATEGORY_LABELS[categoryId],
    level: 2 as const,
  })),
];

type CategoryFilter = CustomerGlossaryCategoryId | "all";

function GlossaryTermEntry(props: { readonly term: CustomerGlossaryTerm }): React.ReactElement {
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

            return (
              <span key={relatedId}>
                {index > 0 ? ", " : ""}
                <Link href={`#term-${relatedId}`} className="text-teal-700 underline dark:text-teal-400">
                  {label}
                </Link>
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

  return (
    <div className={HELP_PAGE_LAYOUT.contentGrid}>
      <div className="min-w-0 space-y-8" data-testid="help-glossary-primary">
        <section id="glossary-search" className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24 space-y-4")}>
          <h2 className={cn("sr-only", OPERATOR_TYPOGRAPHY.sectionTitle)}>{CUSTOMER_GLOSSARY_SEARCH_LABEL}</h2>
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
            <button
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                category === "all"
                  ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                  : "border-neutral-300 bg-white text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-950",
              )}
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              {CUSTOMER_GLOSSARY_ALL_TERMS_FILTER}
            </button>
            {CUSTOMER_GLOSSARY_CATEGORY_ORDER.map((categoryId) => (
              <button
                key={categoryId}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  category === categoryId
                    ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                    : "border-neutral-300 bg-white text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-950",
                )}
                aria-pressed={category === categoryId}
                onClick={() => setCategory(categoryId)}
              >
                {CUSTOMER_GLOSSARY_CATEGORY_LABELS[categoryId]}
              </button>
            ))}
          </div>
          <nav aria-label="Alphabetical glossary index" data-testid="glossary-letter-index">
            <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
                const enabled = availableLetters.includes(letter);
                const firstTerm = enabled
                  ? filteredTerms.find((term) => term.label.toUpperCase().startsWith(letter))
                  : undefined;

                return (
                  <li key={letter}>
                    {enabled && firstTerm !== undefined ? (
                      <a
                        href={`#term-${firstTerm.id}`}
                        className="inline-flex min-w-7 justify-center rounded border border-neutral-300 px-2 py-1 text-sm font-medium text-teal-800 underline-offset-2 hover:underline dark:border-neutral-700 dark:text-teal-300"
                      >
                        {letter}
                      </a>
                    ) : (
                      <span
                        aria-hidden
                        className="inline-flex min-w-7 justify-center rounded border border-neutral-200 px-2 py-1 text-sm text-neutral-400 dark:border-neutral-800 dark:text-neutral-600"
                      >
                        {letter}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
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
                  <GlossaryTermEntry key={term.id} term={term} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <HelpTopicTableOfContents headings={GLOSSARY_TOC_HEADINGS} enableScrollSpy />
    </div>
  );
}
