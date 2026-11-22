import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
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
  EVIDENCE_GRAPH_PNG_EXPORT_DISCLAIMER,
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
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { graphScopeModeHrefFromSearch } from "@/lib/insights/graph-scope-mode-url";
import { graphNodeTypeHrefFromSearch } from "@/lib/insights/graph-node-type-url";
import type { EvidenceTrailPresentationView, GraphMode } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { BUYER_EVIDENCE_TRAIL_GRAPH_MODE_OPTIONS } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { GraphInteractiveCanvas } from "@/app/(operator)/insights/evidence-graph/_sections/GraphInteractiveCanvas";
import { GraphLoadedZeroNodesPartialCaptureHonesty } from "@/app/(operator)/insights/evidence-graph/_sections/GraphLoadedZeroNodesPartialCaptureHonesty";
import { GraphTypeFilterEmptyPartialCaptureHonesty } from "@/app/(operator)/insights/evidence-graph/_sections/GraphTypeFilterEmptyPartialCaptureHonesty";
import { GraphTypeFilterAndNodeFocusCombinedEmptyPartialHonesty } from "@/app/(operator)/insights/evidence-graph/_sections/GraphTypeFilterAndNodeFocusCombinedEmptyPartialHonesty";
import { EVIDENCE_GRAPH_TYPE_FILTER_AND_NODE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-and-node-focus-combined-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_NODE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-node-focus-only-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_PATH_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-path-only-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_EDGE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-edge-focus-only-empty-not-load-failure-copy";
import { parseGraphPathOnlyFromSearch } from "@/lib/insights/graph-path-only-url";
import { parseGraphEdgeFocusFromSearch } from "@/lib/insights/graph-edge-focus-url";
import {
  filterGraphViewModelToNodeIds,
  resolveBuyerTrailPathNodeIds,
} from "@/lib/graph-buyer-path-filter";
import {
  EVIDENCE_GRAPH_PNG_RASTER_FAILURE_NOT_EMPTY_GRAPH_LINE,
  EVIDENCE_GRAPH_PNG_TAINTED_NOT_EMPTY_GRAPH_LINE,
} from "@/lib/insights/evidence-graph-png-raster-honesty-copy";
import { formatInfraEvidenceMermaidPngExportError } from "@/lib/infra-evidence/infra-evidence-mermaid-png-export-error";
import { parseGraphNodeFocusFromSearch } from "@/lib/insights/graph-node-focus-url";
import { parseGraphNodeIdFromSearch } from "@/lib/insights/graph-node-decision-id-url";
import type { GraphViewModel } from "@/types/graph";
import { resolveEvidenceGraphReviewPackageHref } from "@/lib/evidence-graph-review-package-href";

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
  manifestVersion?: string | null;
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
  readonly pinnedArchitectureId?: string | null;
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
    manifestVersion = null,
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
  const [exportError, setExportError] = useState<string | null>(null);
  const [pngRasterHonesty, setPngRasterHonesty] = useState<"tainted" | "raster" | null>(null);
  const latestPngExport = useRef(0);
  const currentSearch = searchParams.toString();
  const runTrim = runId.trim();
  const showcaseRun = canonicalizeDemoRunId(runTrim) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
  const buyerTrailPresentation = demoUi || (buyerPolishedShell && showcaseRun);
  const reviewPackageHref = resolveEvidenceGraphReviewPackageHref({
    runId: runTrim,
    pathname,
    queryArchitectureId: searchParams.get("architectureId"),
    pinnedArchitectureId: props.pinnedArchitectureId,
  });

  const typeFilterTrim = typeFilter.trim();
  const filteredGraphByType = useMemo(
    () => graphViewModelFilteredByNodeType(graph, typeFilter),
    [graph, typeFilter],
  );
  const graphNodeFocusTrim = parseGraphNodeFocusFromSearch(searchParams.get("graphNodeFocus")).trim();
  const graphNodeIdTrim = parseGraphNodeIdFromSearch(searchParams.get("graphNodeId")).trim();
  const graphNodeSearchActive = graphNodeFocusTrim.length > 0 || graphNodeIdTrim.length > 0;
  const showTypeFilterEmptyHonesty =
    !loading
    && runTrim.length > 0
    && graph.nodes.length > 0
    && typeFilterTrim.length > 0
    && filteredGraphByType.nodes.length === 0;
  const pinnedGraphNodeId = graphNodeIdTrim.length > 0 ? graphNodeIdTrim : graphNodeFocusTrim;
  const pinnedNodeMissingOnFilteredGraph =
    pinnedGraphNodeId.length > 0
    && !filteredGraphByType.nodes.some((node) => node.id === pinnedGraphNodeId);
  const showNodeFocusOnlyEmptyHonesty =
    !loading
    && runTrim.length > 0
    && graph.nodes.length > 0
    && pinnedNodeMissingOnFilteredGraph
    && !showTypeFilterEmptyHonesty;
  const pathOnlyActive = parseGraphPathOnlyFromSearch(searchParams.get("pathOnly"));
  const pathNodeIdsForHonesty = useMemo(() => {
    if (!pathOnlyActive || pinnedGraphNodeId.length === 0) {
      return null;
    }

    return resolveBuyerTrailPathNodeIds(filteredGraphByType, pinnedGraphNodeId);
  }, [filteredGraphByType, pathOnlyActive, pinnedGraphNodeId]);
  const pathScopedGraphForHonesty = useMemo(() => {
    if (pathNodeIdsForHonesty === null) {
      return null;
    }

    return filterGraphViewModelToNodeIds(filteredGraphByType, pathNodeIdsForHonesty);
  }, [filteredGraphByType, pathNodeIdsForHonesty]);
  const graphEdgeIdTrim = parseGraphEdgeFocusFromSearch(searchParams.get("graphEdgeId")).trim();
  const pinnedEdgeMissingOnFilteredGraph =
    graphEdgeIdTrim.length > 0
    && !filteredGraphByType.edges.some((edge) => edge.id === graphEdgeIdTrim);
  const showEdgeFocusOnlyEmptyHonesty =
    !loading
    && runTrim.length > 0
    && graph.edges.length > 0
    && pinnedEdgeMissingOnFilteredGraph
    && !showTypeFilterEmptyHonesty;
  const showPathOnlyEmptyHonesty =
    !loading
    && runTrim.length > 0
    && graph.nodes.length > 0
    && pathOnlyActive
    && !showTypeFilterEmptyHonesty
    && filteredGraphByType.nodes.length > 0
    && !showNodeFocusOnlyEmptyHonesty
    && (
      (pinnedGraphNodeId.length > 0 && pathNodeIdsForHonesty === null && !pinnedNodeMissingOnFilteredGraph)
      || (pathScopedGraphForHonesty !== null && pathScopedGraphForHonesty.nodes.length === 0)
    );
  const showTypeFilterAndNodeFocusCombinedHonesty =
    showTypeFilterEmptyHonesty && graphNodeSearchActive;

  function ensureGraphExportAllowed(): boolean {
    const blockedReason = runCollateralSealedManifestCopyBlockedReason({
      runId: runTrim,
      manifestVersion,
    });

    if (blockedReason !== null) {
      setExportError(blockedReason);
      return false;
    }

    setExportError(null);
    return true;
  }

  const operatorGraphCanvas = (
    <>
      {!loading && runTrim.length > 0 && graph.nodes.length === 0 ? (
        <GraphLoadedZeroNodesPartialCaptureHonesty />
      ) : null}
      {showNodeFocusOnlyEmptyHonesty ? (
        <p
          className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="evidence-graph-node-focus-only-empty-not-load-failure"
        >
          {EVIDENCE_GRAPH_NODE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE}
        </p>
      ) : null}
      {showEdgeFocusOnlyEmptyHonesty ? (
        <p
          className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="evidence-graph-edge-focus-only-empty-not-load-failure"
        >
          {EVIDENCE_GRAPH_EDGE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE}
        </p>
      ) : null}
      {showPathOnlyEmptyHonesty ? (
        <p
          className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="evidence-graph-path-only-empty-not-load-failure"
        >
          {EVIDENCE_GRAPH_PATH_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE}
        </p>
      ) : null}
      {showTypeFilterAndNodeFocusCombinedHonesty ? (
        <div className="mb-3 space-y-2">
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="evidence-graph-type-filter-and-node-focus-combined-empty"
          >
            {EVIDENCE_GRAPH_TYPE_FILTER_AND_NODE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE}
          </p>
          <GraphTypeFilterAndNodeFocusCombinedEmptyPartialHonesty />
        </div>
      ) : null}
      {showTypeFilterEmptyHonesty && !showTypeFilterAndNodeFocusCombinedHonesty ? (
        <div className="mb-3 space-y-2">
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="evidence-graph-type-filter-empty-not-load-failure"
          >
            {EVIDENCE_GRAPH_TYPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
          </p>
          <GraphTypeFilterEmptyPartialCaptureHonesty />
        </div>
      ) : null}
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
              if (!ensureGraphExportAllowed()) {
                return;
              }

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
              if (!ensureGraphExportAllowed()) {
                return;
              }

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
              if (!ensureGraphExportAllowed()) {
                return;
              }

              const attempt = ++latestPngExport.current;
              setPngRasterHonesty(null);
              const element = document.getElementById("knowledge-graph-canvas");

              if (!element) {
                return;
              }

              try {
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
              } catch (error: unknown) {
                if (attempt === latestPngExport.current) {
                  setPngRasterHonesty(formatInfraEvidenceMermaidPngExportError(error) !== null ? "tainted" : "raster");
                }
              }
            }}
          >
            Export PNG
          </Button>
        </div>
        <p
          className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="graph-png-export-disclaimer"
        >
          {EVIDENCE_GRAPH_PNG_EXPORT_DISCLAIMER}
        </p>
        {exportError !== null ? (
          <p
            role="alert"
            className={cn("m-0 w-full text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="graph-export-error"
          >
            {exportError}
          </p>
        ) : null}
        {pngRasterHonesty === "tainted" ? (
          <p className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="graph-png-tainted-not-empty-graph">
            {EVIDENCE_GRAPH_PNG_TAINTED_NOT_EMPTY_GRAPH_LINE}
          </p>
        ) : null}
        {pngRasterHonesty === "raster" ? (
          <p className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="graph-png-raster-failure-not-empty-graph">
            {EVIDENCE_GRAPH_PNG_RASTER_FAILURE_NOT_EMPTY_GRAPH_LINE}
          </p>
        ) : null}
        <SponsorExportSendHonestyStrip className="max-w-xl" testIdPrefix="evidence-graph-export" />
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
                <Link href={reviewPackageHref}>{BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE}</Link>
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
