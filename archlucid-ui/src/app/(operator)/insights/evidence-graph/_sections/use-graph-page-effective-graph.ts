"use client";

import { useEffect, useMemo } from "react";

import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import {
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoProvenanceGraph,
} from "@/lib/operator/operator-static-demo";
import { isSampleGraphActive } from "@/lib/graph-page-state";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { GraphViewModel } from "@/types/graph";
import {
  applyProvenanceDemoPresentationIfEligible,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";

export type UseGraphPageEffectiveGraphInput = {
  readonly runId: string;
  readonly mode: GraphMode;
  readonly graph: GraphViewModel | null;
  readonly buyerPolishedShell: boolean;
  readonly graphLoadRequested: boolean;
  readonly urlGraphNodeId: string;
  readonly setGraph: (value: GraphViewModel | null) => void;
};

export function useGraphPageEffectiveGraph(input: UseGraphPageEffectiveGraphInput) {
  const {
    runId,
    mode,
    graph,
    buyerPolishedShell,
    graphLoadRequested,
    urlGraphNodeId,
    setGraph,
  } = input;

  const seededProvenanceGraphVm = useMemo((): GraphViewModel | null => {
    if (mode !== "provenance-full") {
      return null;
    }

    const rid = runId.trim();

    if (rid.length === 0) {
      return null;
    }

    const prov = tryStaticDemoProvenanceGraph(rid);

    if (prov === null) {
      return null;
    }

    return applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), mode, rid);
  }, [mode, runId]);

  const effectiveGraph = graph ?? seededProvenanceGraphVm;
  const sampleGraphActive = isSampleGraphActive({
    runId,
    graph,
    seededProvenanceGraphVm,
  });

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runId.trim());

  const defaultSelectedGraphNodeId =
    urlGraphNodeId.length > 0
      ? urlGraphNodeId
      : buyerPolishedShell &&
          canonicalizeDemoRunId(runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
        ? SHOWCASE_PHI_FINDING_GRAPH_NODE_ID
        : undefined;

  useEffect(() => {
    if (buyerPolishedShell && !graphLoadRequested) {
      return;
    }

    const rid = runId.trim();
    const demo =
      isBuyerPolishedOperatorShellEnv() ||
      isNextPublicDemoMode() ||
      isStaticDemoPayloadFallbackEnabled() ||
      isStaticDemoPayloadFallbackActiveForRun(rid);

    if (!demo || mode !== "provenance-full") {
      return;
    }

    const prov = tryStaticDemoProvenanceGraph(rid);

    if (prov === null) {
      return;
    }

    setGraph(applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), mode, rid));
  }, [runId, mode, graphLoadRequested, buyerPolishedShell, setGraph]);

  return {
    effectiveGraph,
    sampleGraphActive,
    demoUi,
    defaultSelectedGraphNodeId,
  };
}
