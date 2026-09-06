"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SeverityTag } from "@/components/ui/severity-tag";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import type { RunSummary } from "@/types/authority";
import type { GlobalSearchBarController } from "@/components/use-global-search-bar";

type GlobalSearchGlobalResultsPanelProps = {
  readonly controller: GlobalSearchBarController;
};

function globalSearchRunLabel(run: {
  runId: string;
  description?: string | null;
  displayName?: string | null;
}): string {
  return buyerFacingReviewTitleFromSummary(run as RunSummary);
}

export function GlobalSearchGlobalResultsPanel(props: GlobalSearchGlobalResultsPanelProps) {
  const { controller } = props;
  const { inputId, query, searchResults, closePanel, navigateToRun, navigateToFinding } = controller;
  const {
    loading,
    searchError,
    results,
    findPageMatches,
    helpHits,
    architectureIdentityHits,
    architectureDraftHits,
    hasResults,
    fetchResults,
  } = searchResults;

  return (
    <div
      id={`${inputId}-results`}
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
    >
      {loading ? <p className={cn("m-0 px-3 py-2 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>Searching…</p> : null}
      {!loading && searchError ? (
        <div className="px-3 py-2">
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
            Search is temporarily unavailable.
          </p>
          <button
            type="button"
            className={cn("mt-1 text-al-link underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.helper)}
            onClick={() => void fetchResults(query)}
          >
            Try again
          </button>
        </div>
      ) : null}
      {!loading && !searchError && !hasResults ? (
        <div className="px-3 py-2">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>
            No pages, architectures, drafts, reviews, or findings matched.
          </p>
          <p className={cn("m-0 mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Try an architecture name, review title, or keyword, or{" "}
            <Link href="/help" className="text-al-link underline-offset-2 hover:underline" onClick={() => closePanel()}>
              browse help topics
            </Link>
            .
          </p>
        </div>
      ) : null}
      {!loading && findPageMatches.length > 0 ? (
        <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Pages
          </h3>
          <ul className="m-0 list-none p-0">
            {findPageMatches.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={entry.href}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => closePanel()}
                >
                  <span className="font-medium">{entry.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && architectureIdentityHits.length > 0 ? (
        <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Architectures
          </h3>
          <ul className="m-0 list-none p-0">
            {architectureIdentityHits.map((hit) => (
              <li key={hit.architectureId}>
                <Link
                  href={hit.href}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => closePanel()}
                >
                  <span className="font-medium">{hit.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && architectureDraftHits.length > 0 ? (
        <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Drafts
          </h3>
          <ul className="m-0 list-none p-0">
            {architectureDraftHits.map((hit) => (
              <li key={hit.draftId}>
                <Link
                  href={hit.href}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => closePanel()}
                >
                  <span className="font-medium">{hit.displayName}</span>
                  <span
                    className={cn(
                      "ml-2 inline-flex rounded bg-neutral-100 px-1.5 py-0.5 align-middle text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    Draft
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && (results?.runs?.length ?? 0) > 0 ? (
        <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Reviews</h3>
          <ul className="m-0 list-none p-0">
            {results?.runs?.map((run) => (
              <li key={run.runId ?? "unknown-run"}>
                <button
                  type="button"
                  className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => {
                    if (run.runId) {
                      navigateToRun(run.runId);
                    }
                  }}
                >
                  {globalSearchRunLabel({ ...run, runId: run.runId ?? "" })}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && (results?.findings?.length ?? 0) > 0 ? (
        <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Findings</h3>
          <ul className="m-0 list-none p-0">
            {results?.findings?.map((finding) => (
              <li key={`${finding.runId ?? ""}:${finding.findingId ?? ""}`}>
                <button
                  type="button"
                  className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => {
                    if (finding.runId && finding.findingId) {
                      navigateToFinding(finding.runId, finding.findingId);
                    }
                  }}
                >
                  <span className="font-medium">{finding.title}</span>
                  <SeverityTag severity={finding.severity} className="ml-2 align-middle" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && (results?.policyPacks?.length ?? 0) > 0 ? (
        <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Policy packs</h3>
          <ul className="m-0 list-none p-0">
            {results?.policyPacks?.map((pack) => (
              <li key={pack.policyPackId ?? "unknown-pack"}>
                <Link
                  href={`${GOVERNANCE_POLICY_PACKS_PATH}?packId=${encodeURIComponent(pack.policyPackId ?? "")}`}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => closePanel()}
                >
                  {pack.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && helpHits.length > 0 ? (
        <section className="px-3 py-2">
          <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Help</h3>
          <ul className="m-0 list-none p-0">
            {helpHits.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={hit.href}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => closePanel()}
                >
                  <span className="font-medium">{hit.label}</span>
                  <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{hit.searchValue}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
