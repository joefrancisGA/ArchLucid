import type { components } from "@/lib/openapi-schemas";
import type { GraphEdgeVm, GraphNodeVm, GraphViewModel } from "@/types/graph";
import type { RunExplanationSummary } from "@/types/explanation";

/** One node in the UI-shaped provenance graph rendered by the operator-shell `/demo/explain` proof route. */
export type DemoProvenanceGraphNode = GraphNodeVm;

/** One directed edge in the UI-shaped provenance graph (matches `GraphEdgeVm` on the API). */
export type DemoProvenanceGraphEdge = GraphEdgeVm;

/** UI-ready provenance graph payload (matches `GraphViewModel` on the API). */
export type DemoProvenanceGraph = GraphViewModel;

type DemoExplainResponseSchema = components["schemas"]["DemoExplainResponse"];

/**
 * Side-by-side payload returned by `GET /v1/demo/explain` — the citations-bound aggregate explanation
 * and the full provenance graph for the latest committed demo-seed run.
 *
 * The route is gated on `Demo:Enabled=true`; in production-like deployments the server returns 404 and
 * the page renders {@link CitationReference} guidance for re-seeding the demo.
 */
export type DemoExplainResponse = Omit<DemoExplainResponseSchema, "runExplanation" | "provenanceGraph"> & {
  runExplanation: RunExplanationSummary;
  provenanceGraph: DemoProvenanceGraph;
};
