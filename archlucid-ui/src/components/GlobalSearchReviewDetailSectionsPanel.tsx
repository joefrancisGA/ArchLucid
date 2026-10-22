"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import type { GlobalSearchBarController } from "@/components/use-global-search-bar";

type GlobalSearchReviewDetailSectionsPanelProps = {
  readonly controller: GlobalSearchBarController;
};

export function GlobalSearchReviewDetailSectionsPanel(props: GlobalSearchReviewDetailSectionsPanelProps) {
  const { controller } = props;
  const { inputId, searchResults, closePanel } = controller;
  const { reviewDetailSectionMatches } = searchResults;

  return (
    <div
      id={`${inputId}-results`}
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="global-search-review-detail-sections"
    >
      {reviewDetailSectionMatches.length === 0 ? (
        <p className={cn("m-0 px-3 py-2 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>
          No sections on this page matched.
        </p>
      ) : (
        <section className="px-3 py-2">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Sections on this page
          </h3>
          <ul className="m-0 list-none p-0">
            {reviewDetailSectionMatches.map((match) => (
              <li key={match.sectionId}>
                <button
                  type="button"
                  className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => {
                    scheduleScrollToReviewDetailSection(match.sectionId);
                    closePanel();
                  }}
                >
                  {match.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
