import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import Link from "next/link";

import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";
import { GraphReviewTrailLegendChips } from "@/components/GraphReviewTrailLegendChips";
import { Button } from "@/components/ui/button";
import { GraphViewerLegend } from "@/components/usability/GraphViewerLegend";
import { EvidenceTrailTracePanel } from "@/app/(operator)/graph/_sections/EvidenceTrailTracePanel";
import {
  BUYER_GRAPH_GOVERNANCE_NEXT_APPROVED,
  BUYER_GRAPH_GOVERNANCE_NEXT_PENDING,
  BUYER_GRAPH_WHAT_THIS_PROVES,
} from "@/lib/buyer-polish-copy";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { buyerGraphNodeTypeLabel } from "@/lib/buyer-graph-node-type-labels";
import { graphLooksLikeCoordinatorProvenanceTrail } from "@/lib/graph-mapper";
import {
  downloadBrowserTextFile,
  graphViewModelToJsonSnapshot,
  graphViewModelToMermaidFlowchart,
  safeGraphExportFilenameSegment,
} from "@/lib/graph-view-model-export";
import { graphViewModelFilteredByNodeType } from "@/lib/graph-view-model-type-filter";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvidenceTrailPresentationView, GraphMode } from "@/app/(operator)/graph/_sections/graph-page-helpers";
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
  /** Deep-link: pre-select this graph node id in buyer-trail presentation when it exists on the loaded graph. */
  defaultSelectedGraphNodeId?: string;
  presentationView?: EvidenceTrailPresentationView;
  onPresentationViewChange?: (view: EvidenceTrailPresentationView) => void;
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
    defaultSelectedGraphNodeId,
    presentationView = "trace",
    onPresentationViewChange,
  } = props;

  const runTrim = runId.trim();
  const showcaseRun = canonicalizeDemoRunId(runTrim) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const buyerTrailPresentation = demoUi || (buyerPolishedShell && showcaseRun);

  const buyerTraceView = buyerPolishedShell && presentationView === "trace";
  const buyerGraphView = buyerPolishedShell && presentationView === "graph";

  return (
    <>
      {buyerPolishedShell ? (
        <div className={cn("mb-6 space-y-3", graphMainColumnMaxClass)}>
          {buyerTraceView ? (
            <EvidenceTrailTracePanel
              runId={runTrim}
              onOpenGraphView={() => onPresentationViewChange?.("graph")}
            />
          ) : null}
          {buyerGraphView && graphLooksLikeCoordinatorProvenanceTrail(graph) && demoUi ? (
            <div>
              <p className={cn("m-0 mb-1.5", OPERATOR_NAV_GROUP_LABEL)}>
                What this graph proves
              </p>
              <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.body)}>
                {BUYER_GRAPH_WHAT_THIS_PROVES}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
      {!buyerPolishedShell ? controls : null}
      {buyerTraceView ? null : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {!buyerPolishedShell ? (
              <label>
                Filter by type{" "}
                <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)} className="ml-2 p-1.5">
                  <option value="">All types</option>
                  {nodeTypes.map((t) => (
                    <option key={t} value={t}>
                      {buyerPolishedShell ? buyerGraphNodeTypeLabel(t) : t}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <span className={OPERATOR_TYPOGRAPHY.helper}>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Download the visible graph as PNG"
                  onClick={async () => {
                    const element = document.getElementById("knowledge-graph-canvas");

                    if (element) {
                      const html2canvas = (await import("html2canvas")).default;
                      const canvas = await html2canvas(element, { useCORS: true });
                      const dataUrl = canvas.toDataURL("image/png");
                      const slug = safeGraphExportFilenameSegment(runTrim);
                      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                      const link = document.createElement("a");
                      link.download = "graph-" + slug + "-" + mode + "-" + stamp + ".png";
                      link.href = dataUrl;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  Export PNG
                </Button>
              </div>
            ) : null}
          </div>
          {!buyerPolishedShell ? (
            <div className={cn("mb-3", graphMainColumnMaxClass)}>
              <p className={cn("m-0 mb-1.5", OPERATOR_TYPOGRAPHY.tab, "text-al-text-secondary")}>Legend</p>
              {graphLooksLikeCoordinatorProvenanceTrail(graph) && demoUi ? (
                <GraphReviewTrailLegendChips />
              ) : (
                <GraphNodeKindLegendChips />
              )}
            </div>
          ) : buyerGraphView && graphInteractiveReady && !loading ? (
            <div className={cn("mb-3 space-y-2", graphMainColumnMaxClass)}>
              {graphLooksLikeCoordinatorProvenanceTrail(graph) && demoUi ? (
                <GraphReviewTrailLegendChips buyerPolished />
              ) : (
                <GraphNodeKindLegendChips />
              )}
              <GraphViewerLegend />
            </div>
          ) : null}
          <GraphInteractiveCanvas
            graphSurfaceKey={graphSurfaceKey}
            buyerPolishedShell={buyerPolishedShell}
            graph={graph}
            typeFilter={typeFilter}
            runIdTrimmed={runTrim}
            presentation={buyerTrailPresentation ? "buyerTrail" : "operator"}
            onInteractiveSurfaceReady={buyerPolishedShell ? onGraphInteractiveSurfaceReady : undefined}
            defaultSelectedGraphNodeId={defaultSelectedGraphNodeId}
          />
          {buyerPolishedShell && buyerGraphView ? (
            <div className={cn("mt-6 space-y-2", graphMainColumnMaxClass)}>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.tab, "text-al-text-secondary")}>Next</p>
              <Button type="button" asChild variant="default" size="sm">
                <Link href={`/governance?runId=${encodeURIComponent(runTrim)}`}>
                  {showcaseRun ? BUYER_GRAPH_GOVERNANCE_NEXT_APPROVED : BUYER_GRAPH_GOVERNANCE_NEXT_PENDING}
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
      {demoUi && !buyerPolishedShell ? (
        <p className={cn("m-0 mt-4 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
          Use the controls above to switch reviews or exploration scope — the Claims Intake sample loads this graph
          automatically.
        </p>
      ) : null}
    </>
  );
}
