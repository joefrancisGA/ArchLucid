"use client";

import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";

/**
 * Lightweight stand-in when the graph canvas has not loaded — node-kind key and sample nodes
 * so the page does not read as an empty error state.
 */
export function GraphIdleLegend(props: { readonly buyerPolished?: boolean }) {
  const buyerPolished = props.buyerPolished === true;

  return (
    <div
      className="mb-6 max-w-4xl rounded-lg border-2 border-dashed border-neutral-400 bg-al-surface-raised p-4 shadow-sm ring-1 ring-neutral-300/40 dark:border-neutral-600 dark:bg-neutral-900/50 dark:ring-neutral-700/45"
      data-testid="graph-idle-legend"
    >
      <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {buyerPolished ? "Decision traceability preview" : "Graph preview (sample)"}
      </p>
      {buyerPolished ? (
        <p className="m-0 mt-1 max-w-prose text-xs text-neutral-600 dark:text-neutral-400">
          Shapes how reviewed context, findings, and deliverables connect to the signed manifest for this review package.
        </p>
      ) : (
        <p className="m-0 mt-1 max-w-prose text-xs text-neutral-600 dark:text-neutral-400">
          Loaded graphs represent <strong>decisions</strong>, <strong>findings</strong>, <strong>artifacts</strong>,{" "}
          <strong>review trail events</strong>, and <strong>architecture components</strong> as nodes, with edges for
          provenance and flow. Use the review and mode controls to load or refresh the graph.
        </p>
      )}
      <GraphNodeKindLegendChips className="mt-3" />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900">Review</span>
        <span aria-hidden>→</span>
        <span className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900">Context</span>
        <span aria-hidden>→</span>
        <span className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900">…</span>
      </div>
    </div>
  );
}

export const GRAPH_MODE_NATIVE_TITLES: Record<string, string> = {
  "provenance-full": "Full review-trail graph: decisions, findings, artifacts, review events, and linkage to the review.",
  "decision-subgraph": "Neighborhood focused on one decision id and its connected evidence.",
  "node-neighborhood": "Expand a specific graph node by id up to the selected depth.",
  architecture:
    "Architecture-oriented graph: components and relationships (may paginate on reviews with very large evidence graphs).",
};
