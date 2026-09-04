"use client";

import { GraphLoadedExperience } from "@/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience";
import { GraphFetchStatusAlerts } from "@/app/(operator)/insights/evidence-graph/_sections/GraphFetchStatusAlerts";
import { GraphPickReviewBeforeCanvasStrip } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPickReviewBeforeCanvasStrip";
import { GraphIdlePlaceholder } from "@/app/(operator)/insights/evidence-graph/_sections/GraphIdlePlaceholder";
import { GraphArchitectureNoteBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphArchitectureNoteBanner";
import type { useGraphPage } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page";

type GraphPageViewModel = ReturnType<typeof useGraphPage>;

export type GraphPageCanvasShellProps = {
  readonly vm: GraphPageViewModel;
};

export function GraphPageCanvasShell(props: GraphPageCanvasShellProps): React.JSX.Element {
  const { vm } = props;

  return (
    <>
      {vm.buyerGraphBody}
      {!vm.buyerPolishedShell ? (
        <GraphFetchStatusAlerts
          loading={vm.loading}
          loadFailure={vm.showLoadFailureAlert ? vm.loadFailure : null}
          malformedMessage={vm.malformedMessage}
          buyerPolishedShell={vm.buyerPolishedShell}
          runId={vm.runId}
          onRetry={() => {
            vm.setGraphLoadRequested(true);
            void vm.performGraphLoad();
          }}
          graphEndpointHint={vm.graphEndpointHint}
        />
      ) : null}
      {!vm.buyerPolishedShell && vm.showReviewPickerBeforeCanvas ? (
        <GraphPickReviewBeforeCanvasStrip selectedReviewId={vm.runId} onSelectReview={vm.handleRunIdChange} />
      ) : null}
      {!vm.buyerPolishedShell && vm.showIdleCard && !vm.showReviewPickerBeforeCanvas ? (
        <GraphIdlePlaceholder graphIdlePreset={vm.graphIdlePreset} buyerPolishedShell={vm.buyerPolishedShell} />
      ) : null}
      {!vm.buyerPolishedShell && vm.architectureGraphNote ? (
        <GraphArchitectureNoteBanner graphMainColumnMaxClass={vm.graphMainColumnMaxClass} architectureGraphNote={vm.architectureGraphNote} />
      ) : null}
      {!vm.buyerPolishedShell && vm.effectiveGraph && vm.runId.trim().length > 0 ? (
        <>
          {vm.savedViewsBar}
          <GraphLoadedExperience
            buyerPolishedShell={vm.buyerPolishedShell}
            graphMainColumnMaxClass={vm.graphMainColumnMaxClass}
            graph={vm.effectiveGraph}
            demoUi={vm.demoUi}
            graphSurfaceKey={vm.graphSurfaceKey}
            typeFilter={vm.typeFilter}
            onTypeFilterChange={vm.handleTypeFilterChange}
            nodeTypes={vm.nodeTypes}
            runId={vm.runId}
            mode={vm.mode}
            onModeChange={vm.setMode}
            loading={vm.loading}
            graphInteractiveReady={vm.graphInteractiveReady}
            onGraphInteractiveSurfaceReady={vm.handleGraphInteractiveSurfaceReady}
            controls={vm.controls}
            defaultSelectedGraphNodeId={vm.defaultSelectedGraphNodeId}
            presentationView={vm.presentationView}
            onPresentationViewChange={vm.setPresentationView}
            sampleGraphActive={vm.sampleGraphActive}
            operatorListFirst={vm.workingMode}
          />
        </>
      ) : null}
    </>
  );
}
