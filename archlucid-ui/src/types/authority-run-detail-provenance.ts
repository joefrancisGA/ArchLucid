import type { components } from "@/lib/openapi-schemas";

type ProvenanceNodeSchema = components["schemas"]["ProvenanceNode"];

/** Node in decision provenance graph (`GET …/provenance`). */
export type ProvenanceNode = ProvenanceNodeSchema &
  Required<Pick<ProvenanceNodeSchema, "id" | "referenceId" | "name">> & {
    /** OpenAPI `ProvenanceNodeType` string enum; legacy numeric wire values tolerated. */
    type: NonNullable<ProvenanceNodeSchema["type"]> | number;
  };

type ProvenanceEdgeSchema = components["schemas"]["ProvenanceEdge"];

export type ProvenanceEdge = ProvenanceEdgeSchema &
  Required<Pick<ProvenanceEdgeSchema, "id" | "fromNodeId" | "toNodeId">> & {
    /** OpenAPI `ProvenanceEdgeType` string enum; legacy numeric wire values tolerated. */
    type: NonNullable<ProvenanceEdgeSchema["type"]> | number;
  };

type DecisionProvenanceGraphSchema = components["schemas"]["DecisionProvenanceGraph"];

export type DecisionProvenanceGraph = DecisionProvenanceGraphSchema &
  Required<Pick<DecisionProvenanceGraphSchema, "id" | "runId">> & {
    nodes: ProvenanceNode[];
    edges: ProvenanceEdge[];
  };

type RunPipelineTimelineItemResponseSchema = components["schemas"]["RunPipelineTimelineItemResponse"];

/** Pipeline audit timeline row (`GET …/pipeline-timeline`). */
export type PipelineTimelineItem = RunPipelineTimelineItemResponseSchema &
  Required<
    Pick<RunPipelineTimelineItemResponseSchema, "eventId" | "occurredUtc" | "eventType" | "actorUserName">
  >;
