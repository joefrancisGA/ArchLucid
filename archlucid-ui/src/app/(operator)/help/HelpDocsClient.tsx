"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

/** Default reference links so Help always has content before /doc-index.json loads. */
const HELP_DOCS_STATIC_ENTRIES: readonly DocIndexEntry[] = [
  {
    title: "Choose your next step",
    summary: "Path chooser — evaluate, mid-pilot recovery, procurement, sponsor output, or engineering support.",
    category: "Getting Started",
    url: "/help/choose-your-next-step",
  },
  { title: "Overview (pilot)", summary: "Pilot checklist and recent reviews.", category: "Getting Started", url: "/" },
  {
    title: "New architecture request",
    summary: "Start a guided architecture review request.",
    category: "Getting Started",
    url: "/architecture/reviews/new",
  },
  { title: "Reviews list", summary: "Browse reviews for the workspace.", category: "Operations", url: "/architecture/reviews" },
  {
    title: "Governance findings",
    summary: "Review findings across reviews and policy signals.",
    category: "Operations",
    url: "/governance/findings",
  },
  {
    title: "Policy packs",
    summary: "Declarative policy bundles for review.",
    category: "Security",
    url: "/governance/policy-packs",
  },
  {
    title: "Indexed search",
    summary: "Search reviews, findings, and related records where enabled.",
    category: "Operations",
    url: "/insights/search-review-evidence",
  },
  {
    title: "Troubleshooting",
    summary: "Symptom-first architect triage for Overview, reviews, exports, and permissions.",
    category: "Operations",
    url: "/help/troubleshooting",
  },
  {
    title: "Admin diagnostics",
    summary: "System status, readiness rows, and observability signals.",
    category: "Operations",
    url: "/help/admin-diagnostics",
  },
];

function mergeDocIndex(staticRows: readonly DocIndexEntry[], fetched: DocIndexEntry[] | null): DocIndexEntry[] {
  if (fetched === null || fetched.length === 0) {
    return [...staticRows];
  }

  const seen = new Set<string>();

  for (const e of staticRows) {
    seen.add(`${e.category}|${e.title}|${e.url}`);
  }

  const merged: DocIndexEntry[] = [...staticRows];

  for (const e of fetched) {
    const k = `${e.category}|${e.title}|${e.url}`;

    if (seen.has(k)) {
      continue;
    }

    seen.add(k);
    merged.push(e);
  }

  return merged;
}

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
          setEntries(Array.isArray(data) ? mergeDocIndex(HELP_DOCS_STATIC_ENTRIES, data) : [...HELP_DOCS_STATIC_ENTRIES]);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load documentation index.");
          setEntries([...HELP_DOCS_STATIC_ENTRIES]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Same reference while `entries` is null — avoids a new array reference every render before fetch settles. */
  const mergedEntries = useMemo(() => entries ?? [...HELP_DOCS_STATIC_ENTRIES], [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (q.length === 0) {
      return mergedEntries;
    }

    return mergedEntries.filter((e) => {
      const hay = `${e.title} ${e.summary}`.toLowerCase();

      return hay.includes(q);
    });
  }, [mergedEntries, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocIndexEntry[]>();

    for (const e of filtered) {
      const list = map.get(e.category) ?? [];
      list.push(e);
      map.set(e.category, list);
    }

    return map;
  }, [filtered]);

  function linkProps(url: string): { rel?: string; target?: "_blank" } {
    const external = /^https?:\/\//i.test(url);

    if (!external) {
      return {};
    }

    return { rel: "noreferrer", target: "_blank" };
  }

  return (
    <div className={OPERATOR_LAYOUT.sectionStack}>
      <p className={OPERATOR_TYPOGRAPHY.helper}>
        <strong>Shortcuts</strong> — Use the command palette or search in the shell header where available; shortcut hints appear
        on nav items when configured.
      </p>
      {loadError !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-amber-800 dark:text-amber-200")} role="status">
          Full documentation index could not be refreshed ({loadError}). Quick links below are always available.
        </p>
      ) : null}
      {entries === null ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} role="status">
          Refreshing documentation index…
        </p>
      ) : null}
      <label className={cn("block", OPERATOR_TYPOGRAPHY.navLabel, "text-al-text-primary")} htmlFor="help-doc-search">
        Search documentation
      </label>
      <input
        id="help-doc-search"
        type="search"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
        placeholder="Filter by title or summary"
        className={cn(
          "w-full max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950",
          OPERATOR_TYPOGRAPHY.body,
        )}
        autoComplete="off"
      />

      {filtered.length === 0 ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>No results</p>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const rows = grouped.get(cat);

        if (!rows || rows.length === 0) {
          return null;
        }

        return (
          <section key={cat} aria-labelledby={`help-cat-${cat}`} className={OPERATOR_LAYOUT.sectionHeadingStack}>
            <h2
              id={`help-cat-${cat}`}
              className={OPERATOR_TYPOGRAPHY.sectionTitle}
            >
              {cat}
            </h2>
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={`${cat}-${row.title}-${row.url}`}>
                  <Link
                    href={row.url}
                    className={OPERATOR_LINK.inline}
                    {...linkProps(row.url)}
                  >
                    {row.title}
                  </Link>
                  <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{row.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
