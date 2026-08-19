import type { ArchitectureManifestUnifiedLine } from "@/lib/architecture/architecture-manifest-line-diff";
import type { CompareGovernanceDiffView } from "@/lib/compare-effective-governance-diff";
import type { FindingEvidenceGraphViewMode } from "@/lib/findings/finding-evidence-graph-highlight";
import type { MapGraphPresentation } from "@/lib/graph-mapper";
import type { ProvenanceGraphLayoutResult } from "@/lib/provenance-graph-layout";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";
import type { GraphViewModel } from "@/types/graph";
import type { Edge, Node } from "reactflow";

/** Discriminated task kinds offloaded from INP-sensitive operator surfaces (TB-2166). */
export type InpOffloadTaskKind =
  | "provenanceLayout"
  | "findingEvidenceGraphPrep"
  | "compareGovernanceDiff"
  | "manifestLineDiff"
  | "graphReactFlowMap";

export type InpOffloadProvenanceLayoutPayload = {
  readonly nodes: readonly ArchitectureLinkageNode[];
  readonly edges: readonly ArchitectureLinkageEdge[];
};

export type InpOffloadFindingEvidenceGraphPrepPayload = {
  readonly graph: GraphViewModel;
  readonly graphNodeIdsExamined: readonly string[];
  readonly viewMode: FindingEvidenceGraphViewMode;
};

export type InpOffloadCompareGovernanceDiffPayload = {
  readonly baselineManifest: CompareGovernanceDiffView["baselineManifest"];
  readonly targetManifest: CompareGovernanceDiffView["targetManifest"];
  readonly currentEffective: CompareGovernanceDiffView["currentEffective"];
};

export type InpOffloadManifestLineDiffPayload = {
  readonly beforeText: string;
  readonly afterText: string;
};

export type InpOffloadGraphReactFlowMapPayload = {
  readonly graph: GraphViewModel;
  readonly presentation: MapGraphPresentation;
};

export type InpOffloadPayloadMap = {
  readonly provenanceLayout: InpOffloadProvenanceLayoutPayload;
  readonly findingEvidenceGraphPrep: InpOffloadFindingEvidenceGraphPrepPayload;
  readonly compareGovernanceDiff: InpOffloadCompareGovernanceDiffPayload;
  readonly manifestLineDiff: InpOffloadManifestLineDiffPayload;
  readonly graphReactFlowMap: InpOffloadGraphReactFlowMapPayload;
};

export type InpOffloadResultMap = {
  readonly provenanceLayout: ProvenanceGraphLayoutResult;
  readonly findingEvidenceGraphPrep: {
    readonly nodes: Node[];
    readonly edges: Edge[];
  };
  readonly compareGovernanceDiff: CompareGovernanceDiffView;
  readonly manifestLineDiff: readonly ArchitectureManifestUnifiedLine[];
  readonly graphReactFlowMap: {
    readonly nodes: Node[];
    readonly edges: Edge[];
  };
};

export type InpOffloadRequest<K extends InpOffloadTaskKind = InpOffloadTaskKind> = {
  readonly id: string;
  readonly kind: K;
  readonly payload: InpOffloadPayloadMap[K];
};

export type InpOffloadSuccessResponse<K extends InpOffloadTaskKind = InpOffloadTaskKind> = {
  readonly id: string;
  readonly ok: true;
  readonly kind: K;
  readonly result: InpOffloadResultMap[K];
};

export type InpOffloadErrorResponse = {
  readonly id: string;
  readonly ok: false;
  readonly error: string;
};

export type InpOffloadResponse<K extends InpOffloadTaskKind = InpOffloadTaskKind> =
  | InpOffloadSuccessResponse<K>
  | InpOffloadErrorResponse;

export function isInpOffloadSuccessResponse<K extends InpOffloadTaskKind>(
  response: InpOffloadResponse<K>,
): response is InpOffloadSuccessResponse<K> {
  return response.ok === true;
}
