import type { EmptyStateProps } from "@/components/EmptyState";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { GRAPH_IDLE, GRAPH_IDLE_BUYER } from "@/lib/empty-state-presets";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { graphLooksLikeCoordinatorProvenanceTrail } from "@/lib/graph-mapper";
import { isStaticDemoPayloadFallbackActiveForRun, isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { applyBuyerLabelsToProvenanceGraphViewModel } from "@/lib/provenance-graph-presentation";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
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

export type GraphIdleEmptyPresetOptions = {
  buyerPolished: boolean;
  demoUi: boolean;
  showIdleCard: boolean;
};

/** Resolves graph idle empty-state copy — showcase demo override, then buyer preset, then operator default. */
export function resolveGraphIdleEmptyPreset(options: GraphIdleEmptyPresetOptions): EmptyStateProps {
  if (options.demoUi && options.showIdleCard) {
    const manifestHref = `/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`;
    const auditHref = `/audit?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

    return {
      ...GRAPH_IDLE,
      title: BUYER_SURFACE_VOCABULARY.evidenceGraph,
      description: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} traces evidence from captured context through monitored risks to the signed manifest and deliverables. Choose Open signed manifest or Open audit trail if the canvas is taking longer than expected.`,
      actions: [
        { label: "Open signed manifest", href: manifestHref },
        { label: "Open audit trail", href: auditHref, variant: "outline" as const },
      ],
    };
  }

  if (options.buyerPolished) {
    return GRAPH_IDLE_BUYER;
  }

  return GRAPH_IDLE;
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
