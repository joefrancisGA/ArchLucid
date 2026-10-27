"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildRetrievalHitActionLink,
  retrievalHitRelevanceLabel,
  retrievalHitRelevanceTier,
  retrievalHitSourceTypeLabel,
  resolveRetrievalHitTitle,
} from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit-display";
import type { GlobalSearchBarController } from "@/components/use-global-search-bar";

type GlobalSearchPackageResultsPanelProps = {
  readonly controller: GlobalSearchBarController;
};

export function GlobalSearchPackageResultsPanel(props: GlobalSearchPackageResultsPanelProps) {
  const { controller } = props;
  const { inputId, searchResults, closePanel, resolveFindingHref, packageSearchScope } = controller;
  const { packageHits, packageSearchLoading, packageSearchError, trimmedQuery } = searchResults;
  const scopedRunId = packageSearchScope.packageRunId?.trim() ?? "";

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
          <p className={cn("m-0 px-1 pb-1 text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}>
            Relevance bands are coarse tiers from vector search scores, not calibrated confidence percentages.
          </p>
          <ul className="m-0 list-none p-0">
            {packageHits.map((hit) => {
              const actionLink = buildRetrievalHitActionLink(hit, scopedRunId);
              const legacyFindingHref =
                hit.findingId !== undefined && hit.findingId !== null && hit.findingId.trim().length > 0
                  ? resolveFindingHref(hit.sourceId, hit.findingId)
                  : null;

              return (
              <li key={hit.chunkId}>
                <div className={cn("rounded px-1 py-1.5", OPERATOR_TYPOGRAPHY.body)}>
                  <p className="m-0 font-medium text-al-text-primary">{resolveRetrievalHitTitle(hit.title)}</p>
                  <p className={cn("m-0 mt-0.5 line-clamp-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {hit.text.trim().length > 0 ? hit.text : "Hit text was not stored."}
                  </p>
                  <p className={cn("m-0 mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}>
                    {retrievalHitRelevanceLabel(retrievalHitRelevanceTier(hit.score))} ·{" "}
                    {retrievalHitSourceTypeLabel(hit.sourceType)}
                  </p>
                  {actionLink !== null ? (
                    <Link
                      href={actionLink.href}
                      className={cn("mt-1 inline-block text-al-link underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.helper)}
                      onClick={() => closePanel()}
                    >
                      {actionLink.label}
                    </Link>
                  ) : legacyFindingHref !== null ? (
                    <Link
                      href={legacyFindingHref}
                      className={cn("mt-1 inline-block text-al-link underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.helper)}
                      onClick={() => closePanel()}
                    >
                      Open finding
                    </Link>
                  ) : (
                    <p className={cn("m-0 mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}>
                      Deep link was not stored for this hit.
                    </p>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
