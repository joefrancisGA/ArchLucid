"use client";

import { useEffect, useState } from "react";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { MarketingFaqCategory } from "@/lib/marketing-faq";
import { cn } from "@/lib/utils";

export type MarketingFaqPageTocProps = {
  readonly categories: ReadonlyArray<MarketingFaqCategory>;
};

/** Sticky category index for `/faq` — highlights the section in view via IntersectionObserver. */
export function MarketingFaqPageToc(props: MarketingFaqPageTocProps): React.JSX.Element | null {
  const { categories } = props;
  const [activeId, setActiveId] = useState<string | null>(categories[0]?.id ?? null);

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const elements = categories
      .map((category) => document.getElementById(category.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length === 0) {
          return;
        }

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visibleEntries[0]?.target.id;

        if (id && id.length > 0) {
          setActiveId(id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [categories]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="On this page"
      className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto"
      data-testid="marketing-faq-toc"
    >
      <p className={cn("m-0 font-semibold uppercase tracking-wide text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>
        On this page
      </p>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {categories.map((category) => {
          const active = category.id === activeId;

          return (
            <li key={category.id}>
              <a
                className={cn(
                  MARKETING_SURFACES.inlineLink,
                  active ? "font-semibold text-al-text-primary no-underline" : undefined,
                )}
                href={`#${category.id}`}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {category.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
