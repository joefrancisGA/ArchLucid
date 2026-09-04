import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { GraphPageControlsPresentationTabs } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageControlsBuyerShell";
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
import { graphScopeModeHrefFromSearch } from "@/lib/insights/graph-scope-mode-url";
import { graphNodeTypeHrefFromSearch } from "@/lib/insights/graph-node-type-url";
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
  /** Working desk: list/trace first with canvas behind an explicit tab (LD-14). */
  operatorListFirst?: boolean;
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
    sampleGraphActive = false,
    operatorListFirst = false,
    presentationView = "graph",
  } = props;

  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const runTrim = runId.trim();
  const showcaseRun = canonicalizeDemoRunId(runTrim) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const buyerTrailPresentation = demoUi || (buyerPolishedShell && showcaseRun);
  const reviewPackageHref =
    runTrim.length > 0 ? `/architecture/reviews/${encodeURIComponent(runTrim)}` : "/architecture/reviews";

  const operatorGraphCanvas = (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <FilterChipGroup aria-label="Filter graph nodes by type" className="flex flex-wrap gap-2">
          <FilterChip
            href={graphNodeTypeHrefFromSearch(currentSearch, "", pathname)}
            scroll={false}
            className={buyerFilterChipClass(typeFilter.trim().length === 0, false)}
            aria-current={typeFilter.trim().length === 0 ? "page" : undefined}
          >
            All types
          </FilterChip>
          {nodeTypes.map((nodeType) => (
            <FilterChip
              key={nodeType}
              href={graphNodeTypeHrefFromSearch(currentSearch, nodeType, pathname)}
              scroll={false}
              className={buyerFilterChipClass(typeFilter === nodeType, false)}
              aria-current={typeFilter === nodeType ? "page" : undefined}
            >
              {nodeType}
            </FilterChip>
          ))}
        </FilterChipGroup>
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
  );

  const operatorShellBody =
    operatorListFirst && onPresentationViewChange !== undefined ? (
      <Tabs
        value={presentationView}
        onValueChange={(next) => {
          onPresentationViewChange(next as EvidenceTrailPresentationView);
        }}
      >
        <div className="space-y-2">
          {controls}
          <GraphPageControlsPresentationTabs
            showPresentationTabs
            runTrim={runTrim}
            reviewPackageHref={reviewPackageHref}
            sampleGraphActive={sampleGraphActive}
          />
        </div>
        <TabsContent value="trace" className="pt-0" data-testid="graph-presentation-panel-trace">
          <EvidenceTrailTracePanel
            runId={runTrim}
            onOpenGraphView={() => onPresentationViewChange("graph")}
          />
        </TabsContent>
        <TabsContent value="graph" className="pt-0" data-testid="graph-presentation-panel-graph">
          {operatorGraphCanvas}
        </TabsContent>
      </Tabs>
    ) : (
      <>
        {controls}
        {operatorGraphCanvas}
      </>
    );

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
            <FilterChipGroup
              aria-label="Graph scope"
              className={cn("mb-2 flex flex-wrap gap-2", graphMainColumnMaxClass)}
              data-testid="graph-scope-pills"
            >
              {BUYER_EVIDENCE_TRAIL_GRAPH_MODE_OPTIONS.map((option) => (
                <FilterChip
                  key={option.mode}
                  href={graphScopeModeHrefFromSearch(currentSearch, option.mode, pathname)}
                  scroll={false}
                  className={buyerFilterChipClass(mode === option.mode, false)}
                  aria-current={mode === option.mode ? "page" : undefined}
                  aria-label={`Graph scope: ${option.label}`}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterChipGroup>
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
      {!buyerPolishedShell ? operatorShellBody : null}
    </>
  );
}
