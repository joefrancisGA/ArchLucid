"use client";

import { useCallback } from "react";

import {
  buildGraphSavedViewPayload,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { GraphSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

export type UseGraphSavedViewsInput = {
  readonly runId: string;
  readonly mode: GraphMode;
  readonly decisionId: string;
  readonly nodeId: string;
  readonly depth: number;
  readonly typeFilter: string;
  readonly setRunId: (value: string) => void;
  readonly setMode: (value: GraphMode) => void;
  readonly setDecisionId: (value: string) => void;
  readonly setNodeId: (value: string) => void;
  readonly setDepth: (value: number) => void;
  readonly setTypeFilter: (value: string) => void;
  readonly performGraphLoad: (state?: {
    runId: string;
    mode: GraphMode;
    decisionId: string;
    nodeId: string;
    depth: number;
    typeFilter: string;
  }) => Promise<void>;
  readonly canMutateEnterpriseShell: boolean;
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly effectiveGraph: unknown;
};

export function useGraphSavedViews(input: UseGraphSavedViewsInput) {
  const {
    runId,
    mode,
    decisionId,
    nodeId,
    depth,
    typeFilter,
    setRunId,
    setMode,
    setDecisionId,
    setNodeId,
    setDepth,
    setTypeFilter,
    performGraphLoad,
    canMutateEnterpriseShell,
    buyerPolishedShell,
    demoUi,
    effectiveGraph,
  } = input;

  const showSavedViews =
    canMutateEnterpriseShell &&
    !buyerPolishedShell &&
    !demoUi &&
    effectiveGraph !== null;

  const getGraphSavedViewPayload = useCallback(
    () =>
      buildGraphSavedViewPayload({
        runId,
        mode,
        decisionId,
        nodeId,
        depth,
        typeFilter,
      }),
    [decisionId, depth, mode, nodeId, runId, typeFilter],
  );

  const loadGraphSavedView = useCallback(
    async (view: OperatorSavedView) => {
      const filters = view.payload.filters as GraphSavedViewFilters;
      const nextState = {
        runId: filters.runId ?? runId,
        mode: filters.mode ?? mode,
        decisionId: filters.decisionId ?? decisionId,
        nodeId: filters.nodeId ?? nodeId,
        depth: filters.depth ?? depth,
        typeFilter: filters.typeFilter ?? typeFilter,
      };

      setRunId(nextState.runId);
      setMode(nextState.mode);
      setDecisionId(nextState.decisionId);
      setNodeId(nextState.nodeId);
      setDepth(nextState.depth);
      setTypeFilter(nextState.typeFilter);
      await performGraphLoad(nextState);
    },
    [decisionId, depth, mode, nodeId, performGraphLoad, runId, setDecisionId, setDepth, setMode, setNodeId, setRunId, setTypeFilter, typeFilter],
  );

  return {
    showSavedViews,
    getGraphSavedViewPayload,
    loadGraphSavedView,
  };
}
