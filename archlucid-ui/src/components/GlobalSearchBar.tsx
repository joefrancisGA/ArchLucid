"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

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
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    const trimmed = q.trim();

    if (trimmed.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);

    try {
      const opts = mergeRegistrationScopeForProxy({ cache: "no-store", headers: { Accept: "application/json" } });
      const res = await fetch(`/api/proxy/v1/search?q=${encodeURIComponent(trimmed)}&take=6`, opts);

      if (!res.ok) {
        setResults(null);
        return;
      }

      const body = (await res.json()) as GlobalSearchResponse;
      setResults(body);
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
    function onOpen() {
      setOpen(true);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }

    function onFocus() {
      setOpen(true);
      inputRef.current?.focus();
    }

    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
    window.addEventListener(FOCUS_GLOBAL_SEARCH_EVENT, onFocus);

    return () => {
      window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
      window.removeEventListener(FOCUS_GLOBAL_SEARCH_EVENT, onFocus);
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

  const hasResults =
    (results?.runs?.length ?? 0) > 0 ||
    (results?.findings?.length ?? 0) > 0 ||
    (results?.policyPacks?.length ?? 0) > 0;

  const resultsPanelOpen = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className={props.className ?? "relative min-w-[12rem] flex-1 max-w-md"} data-testid="global-search">
      <label htmlFor={inputId} className="sr-only">
        Global search
      </label>
      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        placeholder="Search runs, findings, policy packs…"
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
        autoComplete="off"
        className="h-8"
      />
      {resultsPanelOpen ? (
        <div
          id={`${inputId}-results`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
        >
          {loading ? <p className="m-0 px-3 py-2 text-sm text-neutral-500">Searching…</p> : null}
          {!loading && !hasResults ? (
            <p className="m-0 px-3 py-2 text-sm text-neutral-500">No matches.</p>
          ) : null}
          {!loading && (results?.runs?.length ?? 0) > 0 ? (
            <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
              <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">Reviews</h3>
              <ul className="m-0 list-none p-0">
                {results?.runs?.map((run) => (
                  <li key={run.runId}>
                    <button
                      type="button"
                      className="w-full rounded px-1 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                      onClick={() => {
                        router.push(`/reviews/${encodeURIComponent(run.runId)}`);
                        setOpen(false);
                      }}
                    >
                      {run.description?.trim() || run.runId}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {!loading && (results?.findings?.length ?? 0) > 0 ? (
            <section className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
              <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">Findings</h3>
              <ul className="m-0 list-none p-0">
                {results?.findings?.map((finding) => (
                  <li key={`${finding.runId}:${finding.findingId}`}>
                    <button
                      type="button"
                      className="w-full rounded px-1 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                      onClick={() => {
                        router.push(
                          `/reviews/${encodeURIComponent(finding.runId)}/findings/${encodeURIComponent(finding.findingId)}`,
                        );
                        setOpen(false);
                      }}
                    >
                      <span className="font-medium">{finding.title}</span>
                      <span className="ml-2 text-xs text-neutral-500">{finding.severity}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {!loading && (results?.policyPacks?.length ?? 0) > 0 ? (
            <section className="px-3 py-2">
              <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">Policy packs</h3>
              <ul className="m-0 list-none p-0">
                {results?.policyPacks?.map((pack) => (
                  <li key={pack.policyPackId}>
                    <Link
                      href={`/policy-packs?packId=${encodeURIComponent(pack.policyPackId)}`}
                      className="block rounded px-1 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                      onClick={() => setOpen(false)}
                    >
                      {pack.name}
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
