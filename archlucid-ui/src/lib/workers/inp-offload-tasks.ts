import { buildArchitectureManifestUnifiedLines } from "@/lib/architecture/architecture-manifest-line-diff";
import {
  buildCompareGovernanceDiffView,
} from "@/lib/compare-effective-governance-diff";
import {
  applyFindingEvidenceGraphHighlight,
  resolveFindingEvidenceGraphViewModel,
} from "@/lib/findings/finding-evidence-graph-highlight";
import { mapGraphToReactFlow } from "@/lib/graph-mapper";
import { computeProvenanceGraphLayout } from "@/lib/provenance-graph-layout";
import type { Edge, Node } from "reactflow";

import type {
  InpOffloadPayloadMap,
  InpOffloadResultMap,
  InpOffloadTaskKind,
} from "@/lib/workers/inp-offload-contract";

/** Runs an offload task on the current thread — shared by the worker entry and sync fallback. */
export function runInpOffloadTaskSync<K extends InpOffloadTaskKind>(
  kind: K,
  payload: InpOffloadPayloadMap[K],
): InpOffloadResultMap[K] {
  switch (kind) {
    case "provenanceLayout": {
      const input = payload as InpOffloadPayloadMap["provenanceLayout"];

      return computeProvenanceGraphLayout(input.nodes, input.edges) as InpOffloadResultMap[K];
    }

    case "findingEvidenceGraphPrep": {
      const input = payload as InpOffloadPayloadMap["findingEvidenceGraphPrep"];
      const filteredGraph = resolveFindingEvidenceGraphViewModel(
        input.graph,
        input.graphNodeIdsExamined,
        input.viewMode,
      );
      const mapped = mapGraphToReactFlow(filteredGraph, "operator");
      const highlighted = applyFindingEvidenceGraphHighlight(
        mapped.nodes as Node[],
        mapped.edges as Edge[],
        input.graphNodeIdsExamined,
        input.viewMode,
      );

      return highlighted as InpOffloadResultMap[K];
    }

    case "compareGovernanceDiff": {
      const input = payload as InpOffloadPayloadMap["compareGovernanceDiff"];

      return buildCompareGovernanceDiffView({
        baselineManifest: input.baselineManifest,
        targetManifest: input.targetManifest,
        currentEffective: input.currentEffective,
      }) as InpOffloadResultMap[K];
    }

    case "manifestLineDiff": {
      const input = payload as InpOffloadPayloadMap["manifestLineDiff"];

      return buildArchitectureManifestUnifiedLines(input.beforeText, input.afterText) as InpOffloadResultMap[K];
    }

    case "graphReactFlowMap": {
      const input = payload as InpOffloadPayloadMap["graphReactFlowMap"];

      return mapGraphToReactFlow(input.graph, input.presentation) as InpOffloadResultMap[K];
    }

    default: {
      const neverKind: never = kind;
      throw new Error(`Unknown INP offload task: ${String(neverKind)}`);
    }
  }
}

/** Dispatches a worker message to the matching sync task runner. */
export function dispatchInpOffloadRequest(
  request: { readonly kind: InpOffloadTaskKind; readonly payload: InpOffloadPayloadMap[InpOffloadTaskKind] },
): InpOffloadResultMap[InpOffloadTaskKind] {
  return runInpOffloadTaskSync(request.kind, request.payload);
}
