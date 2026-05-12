import type { ReactNode } from "react";
import Link from "next/link";

import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";
import { GraphReviewTrailLegendChips } from "@/components/GraphReviewTrailLegendChips";
import { Button } from "@/components/ui/button";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { graphLooksLikeCoordinatorProvenanceTrail } from "@/lib/graph-mapper";
import {
  downloadBrowserTextFile,
  graphViewModelToJsonSnapshot,
  graphViewModelToMermaidFlowchart,
  safeGraphExportFilenameSegment,
} from "@/lib/graph-view-model-export";
import { graphViewModelFilteredByNodeType } from "@/lib/graph-view-model-type-filter";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { GraphMode } from "@/app/(operator)/graph/_sections/graph-page-helpers";
import { GraphInteractiveCanvas } from "@/app/(operator)/graph/_sections/GraphInteractiveCanvas";
import type { GraphViewModel } from "@/types/graph";

export type GraphLoadedExperienceProps = {
  buyerPolishedShell: boolean;
  graphMainColumnMaxClass: string;
  graph: GraphViewModel;
  demoUi: boolean;
  graphSurfaceKey: string;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  nodeTypes: string[];
  runId: string;
  mode: GraphMode;
  loading: boolean;
  graphInteractiveReady: boolean;
  onGraphInteractiveSurfaceReady: () => void;
  controls: ReactNode;
  leadIntro: string;
};

export function GraphLoadedExperience(props: GraphLoadedExperienceProps) {
  const {
    buyerPolishedShell,
    graphMainColumnMaxClass,
    graph,
    demoUi,
    graphSurfaceKey,
    typeFilter,
    onTypeFilterChange,
    nodeTypes,
    runId,
    mode,
    loading,
    graphInteractiveReady,
    onGraphInteractiveSurfaceReady,
    controls,
    leadIntro,
  } = props;

  const runTrim = runId.trim();

  return (
    <>
      {buyerPolishedShell ? (
        <div className={cn("mb-6 space-y-3", graphMainColumnMaxClass)}>
          <div>
            <p className="m-0 mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              What this graph proves
            </p>
            <p className="m-0 max-w-prose text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              Captured evidence and analysis feed primary risk findings that anchor the governed architecture decisions
              sealed in the manifest and reflected in sponsor and audit deliverables. Select any highlighted node to read
              how it participates in this trace.
            </p>
          </div>
          {graphLooksLikeCoordinatorProvenanceTrail(graph) && demoUi ? (
            <GraphReviewTrailLegendChips buyerPolished />
          ) : (
            <GraphNodeKindLegendChips />
          )}
        </div>
      ) : null}
      {buyerPolishedShell ? (
        <details
          className={cn(
            "mb-6 rounded-lg border border-neutral-200 bg-white/40 dark:border-neutral-700 dark:bg-neutral-900/30",
            graphMainColumnMaxClass,
          )}
        >
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Advanced filters — change review, filters, or reload graph
          </summary>
          <div className="border-t border-neutral-200 px-2 pb-3 pt-1 dark:border-neutral-700">{controls}</div>
        </details>
      ) : (
        controls
      )}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {!buyerPolishedShell ? (
          <label>
            Filter by type{" "}
            <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)} className="ml-2 p-1.5">
              <option value="">All types</option>
              {nodeTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <span className="text-neutral-500 dark:text-neutral-400 text-sm">
          {buyerPolishedShell
            ? graphInteractiveReady && !loading
              ? `${graph.nodes.length} linked evidence and decision records in this view`
              : "Rendering interactive graph…"
            : `${graph.nodes.length} nodes, ${graph.edges.length} edges (before filter)`}
        </span>
        {!buyerPolishedShell ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Download the visible graph as JSON"
              onClick={() => {
                const slug = safeGraphExportFilenameSegment(runTrim);
                const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                const metaUtc = new Date().toISOString();
                const snapshot = graphViewModelFilteredByNodeType(graph, typeFilter);
                const tf = typeFilter.trim();

                downloadBrowserTextFile(
                  `graph-${slug}-${mode}-${stamp}.json`,
                  graphViewModelToJsonSnapshot(snapshot, {
                    runId: runTrim,
                    mode,
                    generatedAtUtc: metaUtc,
                    typeFilterApplied: tf.length > 0 ? tf : null,
                  }),
                  "application/json;charset=utf-8",
                );
              }}
            >
              Export JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Download a Mermaid flowchart for the visible graph"
              onClick={() => {
                const slug = safeGraphExportFilenameSegment(runTrim);
                const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                const snapshot = graphViewModelFilteredByNodeType(graph, typeFilter);

                downloadBrowserTextFile(
                  `graph-${slug}-${mode}-${stamp}.mmd`,
                  graphViewModelToMermaidFlowchart(snapshot),
                  "text/plain;charset=utf-8",
                );
              }}
            >
              Export Mermaid
            </Button>
          </div>
        ) : null}
      </div>
      {!buyerPolishedShell ? (
        <div className={cn("mb-3", graphMainColumnMaxClass)}>
          <p className="m-0 mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">Legend</p>
          {graphLooksLikeCoordinatorProvenanceTrail(graph) && demoUi ? (
            <GraphReviewTrailLegendChips />
          ) : (
            <GraphNodeKindLegendChips />
          )}
        </div>
      ) : null}
      <GraphInteractiveCanvas
        graphSurfaceKey={graphSurfaceKey}
        buyerPolishedShell={buyerPolishedShell}
        graph={graph}
        typeFilter={typeFilter}
        runIdTrimmed={runTrim}
        presentation={demoUi || buyerPolishedShell ? "buyerTrail" : "operator"}
        onInteractiveSurfaceReady={buyerPolishedShell ? onGraphInteractiveSurfaceReady : undefined}
      />
      {buyerPolishedShell ? (
        <div className={cn("mt-6 space-y-2", graphMainColumnMaxClass)}>
          <p className="m-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">Next</p>
          <Button type="button" asChild variant="default" size="sm">
            <Link href={`/governance?runId=${encodeURIComponent(runTrim)}`}>Governance approval</Link>
          </Button>
        </div>
      ) : null}
      {demoUi && buyerPolishedShell ? (
        <p className="m-0 mt-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Expand advanced filters when you need a different finalized package. This view defaults to the{" "}
          {BUYER_SURFACE_VOCABULARY.evidenceGraphNav.toLowerCase()} for {SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.
        </p>
      ) : null}
      {demoUi && !buyerPolishedShell ? (
        <p className="m-0 mt-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Use the controls above to switch reviews or exploration mode — the Claims Intake sample loads this graph
          automatically.
        </p>
      ) : null}
      {!demoUi ? (
        <p className="m-0 mt-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">{leadIntro}</p>
      ) : null}
    </>
  );
}
