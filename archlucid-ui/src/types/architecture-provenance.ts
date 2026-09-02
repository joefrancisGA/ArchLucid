import type { components } from "@/lib/openapi-schemas";

/** Coordinator architecture run linkage graph (GET /v1/architecture/reviews/{runId}/provenance). */

export type ArchitectureLinkageNode = components["schemas"]["ArchitectureLinkageNode"];

export type ArchitectureLinkageEdge = components["schemas"]["ArchitectureLinkageEdge"];

export type ArchitectureTraceTimelineEntry = components["schemas"]["ArchitectureTraceTimelineEntry"];

export type ArchitectureRunProvenanceGraph = components["schemas"]["ArchitectureRunProvenanceGraph"];
