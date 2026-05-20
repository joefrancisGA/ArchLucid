import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { graphLooksLikeCoordinatorProvenanceTrail } from "@/lib/graph-mapper";
import { isStaticDemoPayloadFallbackActiveForRun, isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { applyBuyerLabelsToProvenanceGraphViewModel } from "@/lib/provenance-graph-presentation";
import type { GraphViewModel } from "@/types/graph";

/** Graph visualization mode: which endpoint to query and what graph subset to display. */
export type GraphMode =
  | "provenance-full"
  | "decision-subgraph"
  | "node-neighborhood"
  | "architecture";

export type GraphSavedViewState = {
  runId: string;
  mode: GraphMode;
  decisionId: string;
  nodeId: string;
  depth: number;
  typeFilter: string;
};

export function buildGraphSavedViewPayload(state: GraphSavedViewState) {
  return {
    filters: {
      runId: state.runId,
      mode: state.mode,
      decisionId: state.decisionId,
      nodeId: state.nodeId,
      depth: state.depth,
      typeFilter: state.typeFilter,
    },
    sort: "nodeLabel:asc",
    columnVisibility: {
      showNodeKindLegend: true,
    },
  };
}

export function applyProvenanceDemoPresentationIfEligible(
  model: GraphViewModel,
  mode: GraphMode,
  runIdTrimmed: string,
): GraphViewModel {
  if (mode !== "provenance-full") {
    return model;
  }

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runIdTrimmed);

  if (!demoUi) {
    return model;
  }

  if (!graphLooksLikeCoordinatorProvenanceTrail(model)) {
    return model;
  }

  return applyBuyerLabelsToProvenanceGraphViewModel(model);
}
