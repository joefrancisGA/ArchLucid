import type { components } from "@/lib/openapi-schemas";

type GraphNodeVmSchema = components["schemas"]["GraphNodeVm"];

/** A node in the provenance or architecture graph (id, label, type, optional metadata). */
export type GraphNodeVm = GraphNodeVmSchema &
  Required<Pick<GraphNodeVmSchema, "id" | "label" | "type">> & {
    /** Topology merge / ingestion may propagate agent narration for explainability. */
    reasoningTrace?: string | null;
  };

type GraphEdgeVmSchema = components["schemas"]["GraphEdgeVm"];

/** A directed edge in the graph (source → target with a relationship type). */
export type GraphEdgeVm = GraphEdgeVmSchema &
  Required<Pick<GraphEdgeVmSchema, "source" | "target" | "type">> & {
    /** Snapshot edge identifier when serialized from architecture graph payloads. */
    id?: string | null;
    label?: string | null;
    inferenceSource?: string | null;
    reasoningTrace?: string | null;
  };

type GraphNodesPageResponseSchema = components["schemas"]["GraphNodesPageResponse"];

/** Paginated architecture graph (GET /v1/evidence-graph/reviews/{runId}/nodes). */
export type GraphNodesPageResponse = Omit<
  GraphNodesPageResponseSchema &
    Required<Pick<GraphNodesPageResponseSchema, "page" | "pageSize" | "totalNodes" | "hasMore">>,
  "nodes" | "edges"
> & {
  nodes: GraphNodeVm[];
  edges: GraphEdgeVm[];
};

type GraphViewModelSchema = components["schemas"]["GraphViewModel"];

/** Complete graph view model returned by provenance and architecture graph endpoints. */
export type GraphViewModel = Omit<GraphViewModelSchema, "nodes" | "edges"> & {
  nodes: GraphNodeVm[];
  edges: GraphEdgeVm[];
  /** API 55R+: graph endpoints include counts for empty-state UX. */
  nodeCount?: number;
  edgeCount?: number;
  isEmpty?: boolean;
};
