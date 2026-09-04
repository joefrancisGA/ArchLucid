"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { retrievalHitRelevanceLabel } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit-display";
import type { GlobalSearchBarController } from "@/components/use-global-search-bar";

type GlobalSearchPackageResultsPanelProps = {
  readonly controller: GlobalSearchBarController;
};

export function GlobalSearchPackageResultsPanel(props: GlobalSearchPackageResultsPanelProps) {
  const { controller } = props;
  const { inputId, searchResults, closePanel } = controller;
  const { packageHits, packageSearchLoading, packageSearchError, trimmedQuery } = searchResults;

  return (
    <div
      id={`${inputId}-results`}
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="global-search-package-results"
    >
      {packageSearchLoading ? (
        <p className={cn("m-0 px-3 py-2 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>Searching this review…</p>
      ) : null}
      {!packageSearchLoading && packageSearchError ? (
        <p className={cn("m-0 px-3 py-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          Package search is temporarily unavailable.
        </p>
      ) : null}
      {!packageSearchLoading && !packageSearchError && packageHits.length === 0 && trimmedQuery.length >= 2 ? (
        <p className={cn("m-0 px-3 py-2 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>
          No findings or evidence in this review matched.
        </p>
      ) : null}
      {!packageSearchLoading && packageHits.length > 0 ? (
        <section className="px-3 py-2">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            This review
          </h3>
          <ul className="m-0 list-none p-0">
            {packageHits.map((hit) => (
              <li key={hit.chunkId}>
                <div className={cn("rounded px-1 py-1.5", OPERATOR_TYPOGRAPHY.body)}>
                  <p className="m-0 font-medium text-al-text-primary">{hit.title}</p>
                  <p className={cn("m-0 mt-0.5 line-clamp-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {hit.text}
                  </p>
                  <p className={cn("m-0 mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}>
                    {retrievalHitRelevanceLabel(hit.score)} · {hit.sourceType}
                  </p>
                  {hit.findingId ? (
                    <Link
                      href={`/architecture/reviews/${encodeURIComponent(hit.sourceId)}/findings/${encodeURIComponent(hit.findingId)}`}
                      className={cn("mt-1 inline-block text-al-link underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.helper)}
                      onClick={() => closePanel()}
                    >
                      Open finding
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
