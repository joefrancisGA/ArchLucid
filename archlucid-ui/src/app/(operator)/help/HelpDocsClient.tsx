"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useHelpDocsIndexQuery } from "@/hooks/use-help-docs-index-query";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_TOC } from "@/lib/help/help-page-layout";
import {
  helpHubClearSearchHrefFromSearch,
  helpHubSearchHrefFromSearch,
  parseHelpHubSearchQuery,
} from "@/lib/help/help-hub-search-url";
import type { DocIndexEntry } from "@/lib/help-docs-index";

export type { DocIndexEntry } from "@/lib/help-docs-index";

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
  { title: "Home (pilot)", summary: "Pilot checklist and recent reviews.", category: "Getting Started", url: "/" },
  {
    title: "New architecture request",
    summary: "Start a guided architecture review request.",
    category: "Getting Started",
    url: "/architecture/reviews/new",
  },
  { title: "Reviews list", summary: "Browse reviews for the workspace.", category: "Operations", url: "/architecture/reviews" },
  {
    title: "Findings queue",
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
    summary: "Symptom-first architect triage for Home, reviews, exports, and permissions.",
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

  const seenKeys = new Set<string>();
  const seenUrls = new Set<string>();

  for (const e of staticRows) {
    seenKeys.add(`${e.category}|${e.title}|${e.url}`);
    seenUrls.add(e.url);
  }

  const merged: DocIndexEntry[] = [...staticRows];

  for (const e of fetched) {
    const k = `${e.category}|${e.title}|${e.url}`;

    if (seenKeys.has(k) || seenUrls.has(e.url)) {
      continue;
    }

    seenKeys.add(k);
    seenUrls.add(e.url);
    merged.push(e);
  }

  return merged;
}

function helpDocCategoriesForDisplay(grouped: Map<string, DocIndexEntry[]>): string[] {
  const knownCategories = new Set<string>(CATEGORY_ORDER);
  const extraCategories = [...grouped.keys()].filter((category) => !knownCategories.has(category));
  extraCategories.sort((left, right) => left.localeCompare(right));

  return [...CATEGORY_ORDER, ...extraCategories];
}

export function HelpDocsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlQuery = parseHelpHubSearchQuery(searchParams.get("q"));
  const indexQuery = useHelpDocsIndexQuery();
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = helpHubSearchHrefFromSearch(searchParams.toString(), query);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [query, router, searchParams]);

  const clearSearch = useCallback(() => {
    setQuery("");
    router.replace(helpHubClearSearchHrefFromSearch(currentSearch), { scroll: false });
  }, [currentSearch, router]);
  const loadError =
    indexQuery.isError
      ? indexQuery.error instanceof Error
        ? indexQuery.error.message
        : "Failed to load documentation index."
      : null;
  const entries = indexQuery.isPending
    ? null
    : mergeDocIndex(HELP_DOCS_STATIC_ENTRIES, indexQuery.data ?? null);

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
        onKeyDown={(event) => {
          if (event.key === "Escape" && query.trim().length > 0) {
            event.preventDefault();
            clearSearch();
          }
        }}
        placeholder="Filter by title or summary"
        className={cn("max-w-xl", HELP_PAGE_TOC.referenceSearchInput)}
        autoComplete="off"
      />

      {filtered.length === 0 ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>No results</p>
      ) : null}

      {helpDocCategoriesForDisplay(grouped).map((cat) => {
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
