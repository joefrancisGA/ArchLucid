import type { components } from "@/lib/openapi-schemas";

/** Coordinator architecture run linkage graph (GET /v1/architecture/reviews/{runId}/provenance). */

export type ArchitectureLinkageNode = components["schemas"]["ArchitectureLinkageNode"];

export type ArchitectureLinkageEdge = components["schemas"]["ArchitectureLinkageEdge"];

export type ArchitectureTraceTimelineEntry = components["schemas"]["ArchitectureTraceTimelineEntry"];

export type ArchitectureRunProvenanceGraph = components["schemas"]["ArchitectureRunProvenanceGraph"];

export type ArchitectureLinkageNodes = NonNullable<ArchitectureRunProvenanceGraph["nodes"]>;
export type ArchitectureLinkageEdges = NonNullable<ArchitectureRunProvenanceGraph["edges"]>;
export type ArchitectureLinkageTimeline = NonNullable<ArchitectureRunProvenanceGraph["timeline"]>;
export type ArchitectureLinkageTraceabilityGaps = NonNullable<
  ArchitectureRunProvenanceGraph["traceabilityGaps"]
>;

/** OpenAPI graph with optional arrays materialized to empty arrays for UI consumers. */
export type NormalizedArchitectureRunProvenanceGraph = Omit<
  ArchitectureRunProvenanceGraph,
  "nodes" | "edges" | "timeline" | "traceabilityGaps"
> & {
  nodes: ArchitectureLinkageNodes;
  edges: ArchitectureLinkageEdges;
  timeline: ArchitectureLinkageTimeline;
  traceabilityGaps: ArchitectureLinkageTraceabilityGaps;
};

export function normalizeArchitectureRunProvenanceGraph(
  graph: ArchitectureRunProvenanceGraph,
): NormalizedArchitectureRunProvenanceGraph {
  return {
    ...graph,
    nodes: graph.nodes ?? [],
    edges: graph.edges ?? [],
    timeline: graph.timeline ?? [],
    traceabilityGaps: graph.traceabilityGaps ?? [],
  };
}
