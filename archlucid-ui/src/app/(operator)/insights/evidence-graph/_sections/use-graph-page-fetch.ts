"use client";

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  getArchitectureGraph,
  getDecisionSubgraph,
  getNodeNeighborhood,
  getProvenanceGraph,
  mergeArchitectureGraphPages,
} from "@/lib/graph-api";
import {
  tryStaticDemoProvenanceGraph,
} from "@/lib/operator/operator-static-demo";
import { coerceGraphViewModel } from "@/lib/operator/operator-response-guards";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import type { GraphViewModel } from "@/types/graph";
import {
  applyProvenanceDemoPresentationIfEligible,
  type GraphMode,
  type GraphSavedViewState,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";

export type UseGraphPageFetchOptions = {
  readonly runId: string;
  readonly mode: GraphMode;
  readonly decisionId: string;
  readonly nodeId: string;
  readonly depth: number;
  readonly typeFilter: string;
  readonly buyerPolishedShell: boolean;
  readonly setTypeFilter: Dispatch<SetStateAction<string>>;
  readonly setGraphInteractiveReady: Dispatch<SetStateAction<boolean>>;
};

export type UseGraphPageFetchResult = {
  readonly graph: GraphViewModel | null;
  readonly setGraph: Dispatch<SetStateAction<GraphViewModel | null>>;
  readonly loading: boolean;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly malformedMessage: string | null;
  readonly architectureGraphNote: string | null;
  readonly performGraphLoad: (override?: Partial<GraphSavedViewState>) => Promise<void>;
};

/** Controller: evidence graph fetch state and load orchestration. */
export function useGraphPageFetch(options: UseGraphPageFetchOptions): UseGraphPageFetchResult {
  const {
    runId,
    mode,
    decisionId,
    nodeId,
    depth,
    typeFilter,
    buyerPolishedShell,
    setTypeFilter,
    setGraphInteractiveReady,
  } = options;

  const [graph, setGraph] = useState<GraphViewModel | null>(null);
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [architectureGraphNote, setArchitectureGraphNote] = useState<string | null>(null);
  const loadGenRef = useRef(0);

  const performGraphLoad = useCallback(async (override?: Partial<GraphSavedViewState>) => {
    const effectiveRunId = override?.runId ?? runId;
    const effectiveMode = override?.mode ?? mode;
    const effectiveDecisionId = override?.decisionId ?? decisionId;
    const effectiveNodeId = override?.nodeId ?? nodeId;
    const effectiveDepth = override?.depth ?? depth;
    const effectiveTypeFilter = override?.typeFilter ?? typeFilter;
    const gen = ++loadGenRef.current;
    setLoading(true);

    if (buyerPolishedShell) {
      setGraphInteractiveReady(false);
    }

    setLoadFailure(null);
    setMalformedMessage(null);
    setArchitectureGraphNote(null);

    const tryStaticProvenance = (): void => {
      if (gen !== loadGenRef.current) {
        return;
      }

      if (effectiveMode !== "provenance-full") {
        return;
      }

      const rid = effectiveRunId.trim();
      const prov = tryStaticDemoProvenanceGraph(rid);

      if (prov === null) {
        return;
      }

      setLoadFailure(null);
      setMalformedMessage(null);
      setGraph(
        applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), effectiveMode, rid),
      );
      setTypeFilter(effectiveTypeFilter);
    };

    try {
      let raw: unknown;

      switch (effectiveMode) {
        case "provenance-full":
          raw = await getProvenanceGraph(effectiveRunId);
          break;
        case "decision-subgraph":
          raw = await getDecisionSubgraph(effectiveRunId, effectiveDecisionId);
          break;
        case "node-neighborhood":
          raw = await getNodeNeighborhood(effectiveRunId, effectiveNodeId, effectiveDepth);
          break;
        case "architecture":
          try {
            raw = await getArchitectureGraph(effectiveRunId);
          } catch (err) {
            const rid = effectiveRunId.trim();

            if (!isApiRequestError(err) || err.httpStatus !== 413 || rid.length === 0) throw err;

            raw = await mergeArchitectureGraphPages(rid);
            setArchitectureGraphNote(
              "Full graph response exceeded the API size limit; loaded all pages via the paginated endpoint. Edges appear only when both endpoints fall on the same page — some cross-page links may be missing from this view.",
            );
          }
          break;
        default:
          throw new Error("Unsupported graph mode.");
      }

      const coerced = coerceGraphViewModel(raw);

      if (!coerced.ok) {
        if (gen !== loadGenRef.current) {
          return;
        }

        setGraph(null);
        setMalformedMessage(coerced.message);
        tryStaticProvenance();

        return;
      }

      if (gen !== loadGenRef.current) {
        return;
      }

      let nextGraph = coerced.value;

      if (effectiveMode === "provenance-full" && nextGraph.nodes.length === 0 && nextGraph.edges.length === 0) {
        const prov = tryStaticDemoProvenanceGraph(effectiveRunId.trim());

        if (prov !== null) {
          nextGraph = provenanceLinkageToGraphViewModel(prov);
        }
      }

      setGraph(applyProvenanceDemoPresentationIfEligible(nextGraph, effectiveMode, effectiveRunId.trim()));
      setTypeFilter(effectiveTypeFilter);

      if (effectiveMode !== "architecture") {
        setArchitectureGraphNote(null);
      }
    } catch (err) {
      if (gen !== loadGenRef.current) {
        return;
      }

      setLoadFailure(toApiLoadFailure(err));
      setGraph(null);
      tryStaticProvenance();

      if (gen === loadGenRef.current && effectiveMode === "provenance-full") {
        const rid = effectiveRunId.trim();
        const prov = tryStaticDemoProvenanceGraph(rid);

        if (prov !== null) {
          setLoadFailure(null);
        }
      }
    } finally {
      if (gen === loadGenRef.current) {
        setLoading(false);
      }
    }
  }, [
    buyerPolishedShell,
    decisionId,
    depth,
    mode,
    nodeId,
    runId,
    setGraphInteractiveReady,
    setTypeFilter,
    typeFilter,
  ]);

  return {
    graph,
    setGraph,
    loading,
    loadFailure,
    malformedMessage,
    architectureGraphNote,
    performGraphLoad,
  };
}
