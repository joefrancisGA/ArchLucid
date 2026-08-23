"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  GLOBAL_SEARCH_ARIA_LABEL,
  GLOBAL_SEARCH_PLACEHOLDER,
  globalSearchInputTitle,
} from "@/lib/keyboard-shortcut-display";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  searchFindPageHelpEntries,
  searchFindPageIndex,
  type FindPageSearchEntry,
} from "@/lib/find-page-search-index";

function globalSearchRunLabel(run: { runId: string; description?: string | null }): string {
  const description = run.description?.trim() ?? "";

  if (description.length > 0) {
    return description;
  }

  return "Untitled review";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);

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
    const timer = window.setTimeout(() => {
      void fetchResults(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [fetchResults, query]);

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

  const hasResults =
    findPageMatches.length > 0 ||
    (results?.runs?.length ?? 0) > 0 ||
    (results?.findings?.length ?? 0) > 0 ||
    (results?.policyPacks?.length ?? 0) > 0 ||
    helpHits.length > 0;

  const resultsPanelOpen = open && query.trim().length >= 2;

  return (
    <div
      ref={rootRef}
      id="find-a-page"
      className={props.className ?? "relative w-full"}
      data-testid="global-search"
    >
      <label htmlFor={inputId} className="sr-only">
        {GLOBAL_SEARCH_ARIA_LABEL}
      </label>
      <p id={`${inputId}-helper`} className="sr-only">
        {GLOBAL_FIND_PAGE_SEARCH.helper}
      </p>

      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        placeholder={GLOBAL_SEARCH_PLACEHOLDER}
        title={globalSearchInputTitle()}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={resultsPanelOpen}
        aria-controls={resultsPanelOpen ? `${inputId}-results` : undefined}
        aria-label={GLOBAL_SEARCH_ARIA_LABEL}
        aria-describedby={`${inputId}-helper`}
        aria-keyshortcuts={COMMAND_PALETTE_ARIA_KEYSHORTCUTS}
        autoComplete="off"
        className="h-8 border-neutral-300 bg-white text-al-text-primary placeholder:text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-400"
      />

      {resultsPanelOpen ? (
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
            <p className={cn("m-0 px-3 py-2 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>No matches.</p>
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
