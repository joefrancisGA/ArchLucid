import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { TabsContent } from "@/components/ui/tabs";
import { EvidenceTrailTracePanel } from "@/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailTracePanel";
import {
  BUYER_GRAPH_GOVERNANCE_NEXT_APPROVED,
  BUYER_GRAPH_GOVERNANCE_NEXT_PENDING,
  BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA,
  BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE,
} from "@/lib/buyer/buyer-polish-copy";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  downloadBrowserTextFile,
  graphViewModelToJsonSnapshot,
  graphViewModelToMermaidFlowchart,
  safeGraphExportFilenameSegment,
} from "@/lib/graph-view-model-export";
import { graphViewModelFilteredByNodeType } from "@/lib/graph-view-model-type-filter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import type { EvidenceTrailPresentationView, GraphMode } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { BUYER_EVIDENCE_TRAIL_GRAPH_MODE_OPTIONS } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { GraphInteractiveCanvas } from "@/app/(operator)/insights/evidence-graph/_sections/GraphInteractiveCanvas";
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
  onModeChange: (mode: GraphMode) => void;
  loading: boolean;
  graphInteractiveReady: boolean;
  onGraphInteractiveSurfaceReady: () => void;
  controls: ReactNode;
  /** Deep-link: pre-select this graph node id in buyer-trail presentation when it exists on the loaded graph. */
  defaultSelectedGraphNodeId?: string;
  presentationView?: EvidenceTrailPresentationView;
  onPresentationViewChange?: (view: EvidenceTrailPresentationView) => void;
  sampleGraphActive?: boolean;
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
    onModeChange,
    loading,
    graphInteractiveReady,
    onGraphInteractiveSurfaceReady,
    controls,
    defaultSelectedGraphNodeId,
    onPresentationViewChange,
    sampleGraphActive: _sampleGraphActive = false,
  } = props;

  void _sampleGraphActive;

  const runTrim = runId.trim();
  const showcaseRun = canonicalizeDemoRunId(runTrim) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const buyerTrailPresentation = demoUi || (buyerPolishedShell && showcaseRun);

  return (
    <>
      {buyerPolishedShell ? (
        <div className="mb-4 space-y-2">
          <TabsContent value="trace" className="pt-0" data-testid="graph-presentation-panel-trace">
            <div className={graphMainColumnMaxClass}>
              <EvidenceTrailTracePanel
                runId={runTrim}
                onOpenGraphView={() => onPresentationViewChange?.("graph")}
              />
            </div>
          </TabsContent>
          <TabsContent value="graph" className="pt-0" data-testid="graph-presentation-panel-graph">
            <div className={cn("mb-2 flex flex-wrap gap-2", graphMainColumnMaxClass)} role="group" aria-label="Graph scope" data-testid="graph-scope-pills">
              {BUYER_EVIDENCE_TRAIL_GRAPH_MODE_OPTIONS.map((option) => (
                <FilterChip
                  key={option.mode}
                  className={buyerFilterChipClass(mode === option.mode, false)}
                  aria-pressed={mode === option.mode}
                  aria-label={`Graph scope: ${option.label}`}
                  onClick={() => onModeChange(option.mode)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
            <div className={cn("mb-2 flex flex-wrap items-center gap-3", graphMainColumnMaxClass)}>
              <span className={OPERATOR_TYPOGRAPHY.helper}>
                {graphInteractiveReady && !loading
                  ? `${graph.nodes.length} linked evidence and decision nodes in this view`
                  : "Rendering interactive graph…"}
              </span>
            </div>
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
            <div className={cn("mt-4 flex flex-wrap gap-2", graphMainColumnMaxClass)}>
              <Button type="button" asChild variant="default" size="sm">
                <Link href={`/governance/approval-queue?runId=${encodeURIComponent(runTrim)}`}>
                  {showcaseRun ? BUYER_GRAPH_GOVERNANCE_NEXT_APPROVED : BUYER_GRAPH_GOVERNANCE_NEXT_PENDING}
                </Link>
              </Button>
              <Button type="button" asChild variant="outline" size="sm">
                <Link href={`/architecture/reviews/${encodeURIComponent(runTrim)}`}>{BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE}</Link>
              </Button>
              <Button type="button" asChild variant="outline" size="sm">
                <Link href={`/insights/evidence-graph?runId=${encodeURIComponent(runTrim)}&presentation=trace`}>
                  {BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA}
                </Link>
              </Button>
            </div>
          </TabsContent>
        </div>
      ) : null}
      {!buyerPolishedShell ? controls : null}
      {!buyerPolishedShell ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
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
            <span className={OPERATOR_TYPOGRAPHY.helper}>
              {`${graph.nodes.length} nodes, ${graph.edges.length} edges (before filter)`}
            </span>
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
          </div>
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
        </>
      ) : null}
    </>
  );
}
