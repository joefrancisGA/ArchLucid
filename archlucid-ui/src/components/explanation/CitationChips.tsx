"use client";

import Link from "next/link";

import type { CitationReference } from "@/types/explanation";

export type CitationChipsProps = {
  citations: CitationReference[] | undefined;
  runId: string;
};

function citationHref(c: CitationReference, runId: string): string {
  switch (c.kind) {
    case "Manifest":
      return `/manifests/${encodeURIComponent(c.id)}`;
    case "Finding":
      return `/runs/${encodeURIComponent(runId)}#finding-${encodeURIComponent(c.id)}`;
    case "DecisionTrace":
    case "GraphSnapshot":
    case "ContextSnapshot":
      return `/runs/${encodeURIComponent(runId)}/provenance`;
    case "EvidenceBundle":
      return `/runs/${encodeURIComponent(runId)}`;
    default:
      return `/runs/${encodeURIComponent(runId)}`;
  }
}

/** Renders persisted artifact links backing aggregate explanation narratives. */
export function CitationChips({ citations, runId }: CitationChipsProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div style={{ margin: "0 0 12px" }}>
      <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#334155" }}>Citations</h4>
      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {citations.map((c) => {
          const href = citationHref(c, runId);
          return (
            <li key={`${c.kind}-${c.id}`}>
              <Link
                href={href}
                className="inline-block rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                aria-label={`Citation ${c.kind}: ${c.label}`}
              >
                <span className="text-neutral-500 dark:text-neutral-400">{c.kind}</span> · {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
