"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  GLOBAL_SEARCH_ARIA_LABEL,
  GLOBAL_SEARCH_PLACEHOLDER,
  globalSearchInputTitle,
} from "@/lib/keyboard-shortcut-display";
import { palettePressUsesPaletteModifier } from "@/components/CommandPalette";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveShellHeaderSearchLabel,
  resolveShellHeaderSearchPlaceholder,
} from "@/lib/shell-header-search-label";
import { dispatchOpenCommandPalette } from "@/lib/shortcut-registry";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  governanceFindingsSearchHrefFromSearch,
  parseGovernanceFindingsSearchQuery,
} from "@/lib/governance/governance-findings-queue-search";
import {
  isGovernanceFindingsQueueHeaderSearchPath,
  isReviewsHubInventoryHeaderSearchPath,
} from "@/lib/shell-header-route-local-search";
import {
  findReviewDetailSectionSearchMatches,
  isReviewDetailHeaderSearchPath,
  type ReviewDetailSectionSearchMatch,
} from "@/lib/review-detail-header-section-search";
import { scheduleScrollToReviewDetailSection } from "@/lib/review-detail-section-scroll";
import {
  parseReviewsHubInventorySearchQuery,
  reviewsHubInventorySearchHrefFromSearch,
} from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/shortcut-registry";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import {
  searchFindPageHelpEntries,
  searchFindPageIndex,
  type FindPageSearchEntry,
} from "@/lib/find-page-search-index";
import type { RunSummary } from "@/types/authority";

function globalSearchRunLabel(run: { runId: string; description?: string | null; displayName?: string | null }): string {
  return buyerFacingReviewTitleFromSummary(run as RunSummary);
}

export const OPEN_GLOBAL_SEARCH_EVENT = "archlucid-open-global-search";
export const FOCUS_GLOBAL_SEARCH_EVENT = "archlucid-focus-global-search";

type GlobalSearchResponse = {
  runs?: Array<{ runId: string; description?: string | null; authorityProjectSlug?: string | null }>;
  findings?: Array<{ runId: string; findingId: string; title: string; severity: string }>;
  policyPacks?: Array<{ policyPackId: string; name: string }>;
};

type GlobalSearchBarProps = {
  readonly className?: string;
};

export function GlobalSearchBar(props: GlobalSearchBarProps) {
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const routeLocalSearchMode = useMemo(() => {
    const path = pathname ?? "";

    if (isReviewsHubInventoryHeaderSearchPath(path)) {
      return "reviews-hub" as const;
    }

    if (isGovernanceFindingsQueueHeaderSearchPath(path)) {
      return "findings-queue" as const;
    }

    if (isReviewDetailHeaderSearchPath(path)) {
      return "review-detail" as const;
    }

    return null;
  }, [pathname]);
  const routeLocalSearchQuery = useMemo(() => {
    if (routeLocalSearchMode === "reviews-hub") {
      return parseReviewsHubInventorySearchQuery(searchParams.get("q"));
    }

    if (routeLocalSearchMode === "findings-queue") {
      return parseGovernanceFindingsSearchQuery(searchParams.get("q"));
    }

    return "";
  }, [routeLocalSearchMode, searchParams]);
  const searchPlaceholder = useMemo(
    () =>
      buyerPolishedShell
        ? resolveShellHeaderSearchPlaceholder(pathname ?? "")
        : GLOBAL_SEARCH_PLACEHOLDER,
    [buyerPolishedShell, pathname],
  );
  const searchAriaLabel = useMemo(
    () => (buyerPolishedShell ? resolveShellHeaderSearchLabel(pathname ?? "") : GLOBAL_SEARCH_ARIA_LABEL),
    [buyerPolishedShell, pathname],
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [reviewDetailSectionMatches, setReviewDetailSectionMatches] = useState<
    readonly ReviewDetailSectionSearchMatch[]
  >([]);

  useEffect(() => {
    if (routeLocalSearchMode === "reviews-hub" || routeLocalSearchMode === "findings-queue") {
      setQuery(routeLocalSearchQuery);
    }
  }, [routeLocalSearchMode, routeLocalSearchQuery]);

  useEffect(() => {
    if (routeLocalSearchMode !== "review-detail") {
      setReviewDetailSectionMatches([]);
      return;
    }

    setReviewDetailSectionMatches(findReviewDetailSectionSearchMatches(query));
  }, [query, routeLocalSearchMode]);

  const replaceRouteLocalSearchQuery = useCallback(
    (nextQuery: string) => {
      const path = pathname ?? "";

      if (routeLocalSearchMode === "reviews-hub") {
        router.replace(reviewsHubInventorySearchHrefFromSearch(searchParams.toString(), nextQuery), {
          scroll: false,
        });
        return;
      }

      if (routeLocalSearchMode === "findings-queue") {
        router.replace(
          governanceFindingsSearchHrefFromSearch(searchParams.toString(), nextQuery, path),
          { scroll: false },
        );
      }
    },
    [pathname, routeLocalSearchMode, router, searchParams],
  );

  const fetchResults = useCallback(async (q: string) => {
    const trimmed = q.trim();

    if (trimmed.length < 2) {
      setResults(null);
      setSearchError(false);
      return;
    }

    setLoading(true);
    setSearchError(false);

    try {
      const opts = mergeRegistrationScopeForProxy({ cache: "no-store", headers: { Accept: "application/json" } });
      const res = await fetch(`/api/proxy/v1/search?q=${encodeURIComponent(trimmed)}&take=6`, opts);

      if (!res.ok) {
        setResults(null);
        setSearchError(true);
        return;
      }

      const body = (await res.json()) as GlobalSearchResponse;
      setResults(body);
    } catch {
      setResults(null);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeLocalSearchMode !== null) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchResults(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [fetchResults, query, routeLocalSearchMode]);

  useEffect(() => {
    if (routeLocalSearchMode === null || routeLocalSearchMode === "review-detail") {
      return;
    }

    const timer = window.setTimeout(() => {
      replaceRouteLocalSearchQuery(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, replaceRouteLocalSearchQuery, routeLocalSearchMode]);

  useEffect(() => {
    function focusInput(): void {
      setOpen(true);
      inputRef.current?.focus();
    }

    function onOpen() {
      setOpen(true);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    function onFocus() {
      focusInput();
    }

    // `#find-a-page` is the documented deep-link target for the header control.
    function focusFromFindAPageHash(): void {
      if (window.location.hash !== "#find-a-page") {
        return;
      }

      window.requestAnimationFrame(() => focusInput());
    }

    focusFromFindAPageHash();
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
    window.addEventListener(FOCUS_GLOBAL_SEARCH_EVENT, onFocus);
    window.addEventListener("hashchange", focusFromFindAPageHash);

    return () => {
      window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
      window.removeEventListener(FOCUS_GLOBAL_SEARCH_EVENT, onFocus);
      window.removeEventListener("hashchange", focusFromFindAPageHash);
    };
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node))
        setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const findPageMatches = searchFindPageIndex(query, { limit: 6 });
  const helpHits = searchFindPageHelpEntries(query, { limit: 4 });
  const trimmedQuery = query.trim();
  const showQuickActions = open && trimmedQuery.length < 2 && routeLocalSearchMode === null;

  const hasResults =
    routeLocalSearchMode === null &&
    (findPageMatches.length > 0 ||
      (results?.runs?.length ?? 0) > 0 ||
      (results?.findings?.length ?? 0) > 0 ||
      (results?.policyPacks?.length ?? 0) > 0 ||
      helpHits.length > 0);

  const reviewDetailPanelOpen =
    open && routeLocalSearchMode === "review-detail" && trimmedQuery.length > 0;
  const globalResultsPanelOpen = open && trimmedQuery.length >= 2 && routeLocalSearchMode === null;
  const resultsPanelOpen = globalResultsPanelOpen || reviewDetailPanelOpen;
  const quickActionsPanelOpen = showQuickActions;

  return (
    <div
      ref={rootRef}
      id="find-a-page"
      className={props.className ?? "relative w-full"}
      data-testid="global-search"
    >
      <label htmlFor={inputId} className="sr-only">
        {searchAriaLabel}
      </label>
      <p id={`${inputId}-helper`} className="sr-only">
        {GLOBAL_FIND_PAGE_SEARCH.helper}
      </p>

      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        placeholder={searchPlaceholder}
        title={globalSearchInputTitle()}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(routeLocalSearchMode === null || routeLocalSearchMode === "review-detail");
        }}
        onFocus={() => setOpen(routeLocalSearchMode === null ? true : open || routeLocalSearchMode === "review-detail")}
        onKeyDown={(event) => {
          if (event.key?.toLowerCase() !== "k") {
            return;
          }

          if (!palettePressUsesPaletteModifier(event, event.target)) {
            return;
          }

          event.preventDefault();
          setOpen(false);
          dispatchOpenCommandPalette(query);
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup={resultsPanelOpen ? "listbox" : quickActionsPanelOpen ? "dialog" : undefined}
        aria-expanded={resultsPanelOpen || quickActionsPanelOpen}
        aria-controls={resultsPanelOpen || quickActionsPanelOpen ? `${inputId}-results` : undefined}
        aria-label={searchAriaLabel}
        aria-describedby={`${inputId}-helper`}
        aria-keyshortcuts={COMMAND_PALETTE_ARIA_KEYSHORTCUTS}
        autoComplete="off"
        className="h-8 border-neutral-300 bg-white text-al-text-primary placeholder:text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-400"
      />

      {quickActionsPanelOpen ? (
        <div
          id={`${inputId}-results`}
          role="dialog"
          aria-label="Quick actions"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
          data-testid="global-search-quick-actions"
        >
          <section className="px-3 py-2">
            <h3 className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              Quick actions
            </h3>
            <ul className="m-0 mt-1 list-none p-0">
              <li>
                <button
                  type="button"
                  className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
                    setOpen(false);
                  }}
                >
                  Command palette
                  <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                    Jump to any page, review, or task
                  </span>
                </button>
              </li>
              <li>
                <Link
                  href={ASK_REVIEW_QUESTIONS_PATH}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => setOpen(false)}
                >
                  Ask review questions
                  <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                    Scoped Q&amp;A over review evidence
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href={SEARCH_REVIEW_EVIDENCE_PATH}
                  className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                  onClick={() => setOpen(false)}
                >
                  Search review evidence
                  <span className={cn("mt-0.5 block text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                    Search the evidence trail across reviews
                  </span>
                </Link>
              </li>
            </ul>
          </section>
        </div>
      ) : null}

      {reviewDetailPanelOpen ? (
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
                        setOpen(false);
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
      ) : null}

      {globalResultsPanelOpen ? (
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
              <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>No pages, reviews, or findings matched.</p>
              <p className={cn("m-0 mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Try a review title or keyword, or{" "}
                <Link href="/help" className="text-al-link underline-offset-2 hover:underline" onClick={() => setOpen(false)}>
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
                {findPageMatches.map((entry: FindPageSearchEntry) => (
                  <li key={entry.id}>
                    <Link
                      href={entry.href}
                      className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-medium">{entry.label}</span>
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
                  <li key={run.runId}>
                    <button
                      type="button"
                      className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                      onClick={() => {
                        router.push(`/architecture/reviews/${encodeURIComponent(run.runId)}`);
                        setOpen(false);
                      }}
                    >
                      {globalSearchRunLabel(run)}
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
                  <li key={`${finding.runId}:${finding.findingId}`}>
                    <button
                      type="button"
                      className={cn("w-full rounded px-1 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                      onClick={() => {
                        router.push(
                          `/architecture/reviews/${encodeURIComponent(finding.runId)}/findings/${encodeURIComponent(finding.findingId)}`,
                        );
                        setOpen(false);
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
                  <li key={pack.policyPackId}>
                    <Link
                      href={`${GOVERNANCE_POLICY_PACKS_PATH}?packId=${encodeURIComponent(pack.policyPackId)}`}
                      className={cn("block rounded px-1 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
                      onClick={() => setOpen(false)}
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
                      onClick={() => setOpen(false)}
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
      ) : null}
    </div>
  );
}
