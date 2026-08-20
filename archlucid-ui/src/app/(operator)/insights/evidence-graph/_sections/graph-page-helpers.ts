import type { EmptyStateProps } from "@/components/EmptyState";
import {
  BUYER_EVIDENCE_TRAIL_GRAPH_MODE_ARCHITECTURE,
  BUYER_EVIDENCE_TRAIL_GRAPH_MODE_DECISION,
  BUYER_EVIDENCE_TRAIL_GRAPH_MODE_FINDING,
} from "@/lib/buyer/buyer-polish-copy";
import {
  EVIDENCE_GRAPH_AWAITING_SELECTION_BODY,
  EVIDENCE_GRAPH_AWAITING_SELECTION_TITLE,
  EVIDENCE_GRAPH_EMPTY_PRIMARY_ACTION,
  EVIDENCE_GRAPH_EMPTY_SECONDARY_START,
  EVIDENCE_GRAPH_EMPTY_SECONDARY_UPLOAD,
} from "@/lib/evidence-graph-page";
import { EXTRACT_UPLOAD_SETTINGS_PATH } from "@/lib/core-pilot-steps";
import { GRAPH_IDLE, GRAPH_IDLE_BUYER } from "@/lib/empty-state-presets";
import { buildInsightsFinalizedReviewPrerequisiteEmpty } from "@/lib/insights-finalized-review-prerequisite-empty";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { graphLooksLikeCoordinatorProvenanceTrail } from "@/lib/graph-mapper";
import { isStaticDemoPayloadFallbackActiveForRun, isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { applyBuyerLabelsToProvenanceGraphViewModel } from "@/lib/provenance-graph-presentation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { GraphViewModel } from "@/types/graph";

const evidenceGraphSampleHref = `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

const EVIDENCE_GRAPH_PREREQUISITE_EMPTY = buildInsightsFinalizedReviewPrerequisiteEmpty({
  jobId: "evidence-graph",
  finalizedCount: 0,
});

const EVIDENCE_GRAPH_IDLE_ACTIONS: EmptyStateProps["actions"] = [
  {
    label: EVIDENCE_GRAPH_PREREQUISITE_EMPTY.actions?.[0]?.label ?? "Open reviews",
    href: EVIDENCE_GRAPH_PREREQUISITE_EMPTY.actions?.[0]?.href ?? "/architecture/reviews",
  },
  {
    label: EVIDENCE_GRAPH_PREREQUISITE_EMPTY.actions?.[1]?.label ?? EVIDENCE_GRAPH_EMPTY_SECONDARY_START,
    href: EVIDENCE_GRAPH_PREREQUISITE_EMPTY.actions?.[1]?.href ?? "/architecture/reviews/new",
    variant: "outline" as const,
  },
  { label: EVIDENCE_GRAPH_EMPTY_SECONDARY_UPLOAD, href: EXTRACT_UPLOAD_SETTINGS_PATH, variant: "outline" as const },
  { label: EVIDENCE_GRAPH_EMPTY_PRIMARY_ACTION, href: evidenceGraphSampleHref, variant: "outline" as const },
];

/** Graph visualization mode: which endpoint to query and what graph subset to display. */
export type GraphMode =
  | "provenance-full"
  | "decision-subgraph"
  | "node-neighborhood"
  | "architecture";

/** Buyer evidence trail: finding-centric table vs visual graph exploration. */
export type EvidenceTrailPresentationView = "trace" | "graph";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_OPTIONS: Readonly<
  { mode: GraphMode; label: string }[]
> = [
  { mode: "provenance-full", label: BUYER_EVIDENCE_TRAIL_GRAPH_MODE_FINDING },
  { mode: "decision-subgraph", label: BUYER_EVIDENCE_TRAIL_GRAPH_MODE_DECISION },
  { mode: "architecture", label: BUYER_EVIDENCE_TRAIL_GRAPH_MODE_ARCHITECTURE },
];

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
  /** Packages exist but no review is selected yet — teach the graph instead of "no reviews". */
  awaitingSelection?: boolean;
};

/** Resolves graph idle empty-state copy — showcase demo override, then buyer preset, then operator default. */
export function resolveGraphIdleEmptyPreset(options: GraphIdleEmptyPresetOptions): EmptyStateProps {
  if (options.buyerPolished || (options.demoUi && options.showIdleCard)) {
    if (options.awaitingSelection === true) {
      return {
        icon: GRAPH_IDLE_BUYER.icon,
        title: EVIDENCE_GRAPH_AWAITING_SELECTION_TITLE,
        description: EVIDENCE_GRAPH_AWAITING_SELECTION_BODY,
        actions: EVIDENCE_GRAPH_IDLE_ACTIONS,
      };
    }

    return {
      icon: GRAPH_IDLE_BUYER.icon,
      title: EVIDENCE_GRAPH_PREREQUISITE_EMPTY.title,
      description: EVIDENCE_GRAPH_PREREQUISITE_EMPTY.description,
      actions: EVIDENCE_GRAPH_IDLE_ACTIONS,
    };
  }

  return GRAPH_IDLE;
}

/** Resolve Trace vs Graph tab from the URL, defaulting Graph for buyer-polished shells. */
export function resolveEvidenceTrailPresentationView(
  urlPresentation: string | null | undefined,
  buyerPolished: boolean,
): EvidenceTrailPresentationView {
  if (urlPresentation === "trace" || urlPresentation === "graph") {
    return urlPresentation;
  }

  return buyerPolished ? "graph" : "trace";
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
