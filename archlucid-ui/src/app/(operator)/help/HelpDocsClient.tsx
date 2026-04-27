"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type DocIndexEntry = {
  title: string;
  summary: string;
  category: string;
  url: string;
};

const CATEGORY_ORDER = [
  "Getting Started",
  "Architecture",
  "Operations",
  "Security",
  "API",
  "Go-to-Market",
] as const;

export function HelpDocsClient() {
  const [entries, setEntries] = useState<DocIndexEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/doc-index.json", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as DocIndexEntry[];

        if (!cancelled) {
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load documentation index.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (entries === null) {
      return [];
    }

    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return entries;
    }

    return entries.filter((e) => {
      const hay = `${e.title} ${e.summary}`.toLowerCase();

      return hay.includes(q);
    });
  }, [entries, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocIndexEntry[]>();

    for (const e of filtered) {
      const list = map.get(e.category) ?? [];
      list.push(e);
      map.set(e.category, list);
    }

    return map;
  }, [filtered]);

  if (loadError !== null) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {loadError}
      </p>
    );
  }

  if (entries === null) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading index…</p>;
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="help-doc-search">
        Search documentation
      </label>
      <input
        id="help-doc-search"
        type="search"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
        placeholder="Filter by title or summary"
        className="w-full max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950"
        autoComplete="off"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">No results</p>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const rows = grouped.get(cat);

        if (!rows || rows.length === 0) {
          return null;
        }

        return (
          <section key={cat} aria-labelledby={`help-cat-${cat}`} className="space-y-2">
            <h2
              id={`help-cat-${cat}`}
              className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {cat}
            </h2>
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={`${cat}-${row.title}-${row.url}`}>
                  <Link
                    href={row.url}
                    className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{row.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
