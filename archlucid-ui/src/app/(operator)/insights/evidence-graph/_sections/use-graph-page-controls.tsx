"use client";

import { cn } from "@/lib/utils";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { GraphSampleModeBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphSampleModeBanner";
import { GraphArchitectureNoteBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphArchitectureNoteBanner";
import { GraphFetchStatusAlerts } from "@/app/(operator)/insights/evidence-graph/_sections/GraphFetchStatusAlerts";
import { GraphIdlePlaceholder } from "@/app/(operator)/insights/evidence-graph/_sections/GraphIdlePlaceholder";
import {
  type EvidenceTrailPresentationView,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { GraphLoadedExperience } from "@/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience";
import { GraphPageControls } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageControls";
import { EvidenceTrailTracePanel } from "@/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailTracePanel";

import type { GraphPageState } from "./use-graph-page-state";

export function useGraphPageControls(state: GraphPageState) {
  const {
    buyerPolishedShell,
    showOperatorControls,
    graphMainColumnMaxClass,
    runId,
    handleRunIdChange,
    mode,
    setMode,
    demoUi,
    showLoadButton,
    loadButtonLabel,
    loading,
    performGraphLoad,
    setGraphLoadRequested,
    decisionId,
    nodeId,
    handleReviewsListAvailabilityChange,
    reviewPickerState,
    sampleGraphActive,
    buyerEmptyWorkspaceFocus,
    showIdleCard,
    graphIdlePreset,
    buyerTraceWithoutGraph,
    showLoadFailureAlert,
    loadFailure,
    malformedMessage,
    graphEndpointHint,
    reviewListAvailability,
    architectureGraphNote,
    effectiveGraph,
    graphSurfaceKey,
    typeFilter,
    handleTypeFilterChange,
    nodeTypes,
    graphInteractiveReady,
    handleGraphInteractiveSurfaceReady,
    defaultSelectedGraphNodeId,
    presentationView,
    setPresentationView,
    showSavedViews,
    getGraphSavedViewPayload,
    loadGraphSavedView,
    graphLoadRequested,
  } = state;

  const showBuyerPresentationTabs =
    buyerPolishedShell && !showIdleCard && (effectiveGraph !== null || graphLoadRequested);

  const savedViewsBar =
    showSavedViews ? (
      <OperatorSavedViewsBar
        surface="graph"
        disabled={loading}
        className={graphMainColumnMaxClass}
        getCurrentPayload={getGraphSavedViewPayload}
        onLoadView={loadGraphSavedView}
      />
    ) : null;

  const controls = (
    <GraphPageControls
      graphMainColumnMaxClass={graphMainColumnMaxClass}
      runId={runId}
      onRunIdChange={handleRunIdChange}
      mode={mode}
      onModeChange={setMode}
      demoUi={demoUi}
      buyerPolishedShell={buyerPolishedShell}
      showLoadButton={showLoadButton}
      loadButtonLabel={loadButtonLabel}
      loading={loading}
      onLoadGraph={() => {
        setGraphLoadRequested(true);
        void performGraphLoad();
      }}
      decisionId={decisionId}
      nodeId={nodeId}
      onReviewsListAvailabilityChange={handleReviewsListAvailabilityChange}
      reviewPickerState={reviewPickerState}
      sampleGraphActive={sampleGraphActive}
      showPresentationTabs={showBuyerPresentationTabs}
      compactEmptyWorkspace={buyerEmptyWorkspaceFocus}
    />
  );

  const buyerIdlePlaceholder = showIdleCard ? (
    <GraphIdlePlaceholder
      graphIdlePreset={graphIdlePreset}
      buyerPolishedShell={buyerPolishedShell}
      className={graphMainColumnMaxClass}
      prioritize={buyerEmptyWorkspaceFocus}
    />
  ) : null;

  const buyerTraceOnlyIdle = buyerTraceWithoutGraph;

  const buyerGraphBody =
    buyerPolishedShell && showOperatorControls ? (
      <Tabs
        value={presentationView}
        onValueChange={(next) => {
          setPresentationView(next as EvidenceTrailPresentationView);
        }}
      >
        {buyerEmptyWorkspaceFocus ? (
          <div className={cn(graphMainColumnMaxClass, OPERATOR_LAYOUT.sectionHeadingStack)}>
            {buyerIdlePlaceholder}
            {controls}
          </div>
        ) : (
          <>
            {controls}
            {buyerIdlePlaceholder}
          </>
        )}
        <GraphFetchStatusAlerts
          loading={loading}
          loadFailure={showLoadFailureAlert ? loadFailure : null}
          malformedMessage={malformedMessage}
          buyerPolishedShell={buyerPolishedShell}
          runId={runId}
          onRetry={() => {
            setGraphLoadRequested(true);
            void performGraphLoad();
          }}
          graphEndpointHint={graphEndpointHint}
        />
        {sampleGraphActive && effectiveGraph !== null ? (
          <GraphSampleModeBanner
            className={graphMainColumnMaxClass}
            showUseMyReviewAction={reviewListAvailability.packageCount > 0}
            compact
          />
        ) : null}
        <TabsContent value="trace" className="pt-0" data-testid="graph-presentation-panel-trace">
          {buyerTraceOnlyIdle ? (
            <div className={graphMainColumnMaxClass}>
              <EvidenceTrailTracePanel runId={runId} onOpenGraphView={() => setPresentationView("graph")} />
            </div>
          ) : null}
        </TabsContent>
        {architectureGraphNote ? (
          <GraphArchitectureNoteBanner
            graphMainColumnMaxClass={graphMainColumnMaxClass}
            architectureGraphNote={architectureGraphNote}
          />
        ) : null}
        {effectiveGraph ? (
          <GraphLoadedExperience
            buyerPolishedShell={buyerPolishedShell}
            graphMainColumnMaxClass={graphMainColumnMaxClass}
            graph={effectiveGraph}
            demoUi={demoUi}
            graphSurfaceKey={graphSurfaceKey}
            typeFilter={typeFilter}
            onTypeFilterChange={handleTypeFilterChange}
            nodeTypes={nodeTypes}
            runId={runId}
            mode={mode}
            onModeChange={setMode}
            loading={loading}
            graphInteractiveReady={graphInteractiveReady}
            onGraphInteractiveSurfaceReady={handleGraphInteractiveSurfaceReady}
            controls={controls}
            defaultSelectedGraphNodeId={defaultSelectedGraphNodeId}
            presentationView={presentationView}
            onPresentationViewChange={setPresentationView}
            sampleGraphActive={sampleGraphActive}
          />
        ) : null}
      </Tabs>
    ) : null;

  return {
    savedViewsBar,
    controls,
    buyerGraphBody,
  };
}
