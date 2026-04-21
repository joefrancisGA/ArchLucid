import type { CitationReference, RunExplanationSummary } from "@/types/explanation";

/** One node in the UI-shaped provenance graph rendered by the operator-shell `/demo/explain` proof route. */
export type DemoProvenanceGraphNode = {
  id: string;
  label: string;
  type: string;
  metadata?: Record<string, string> | null;
};

/** One directed edge in the UI-shaped provenance graph (matches `GraphEdgeVm` on the API). */
export type DemoProvenanceGraphEdge = {
  source: string;
  target: string;
  type: string;
};

/** UI-ready provenance graph payload (matches `GraphViewModel` on the API). */
export type DemoProvenanceGraph = {
  nodes: DemoProvenanceGraphNode[];
  edges: DemoProvenanceGraphEdge[];
  nodeCount: number;
  edgeCount: number;
  isEmpty: boolean;
};

/**
 * Side-by-side payload returned by `GET /v1/demo/explain` — the citations-bound aggregate explanation
 * and the full provenance graph for the latest committed demo-seed run.
 *
 * The route is gated on `Demo:Enabled=true`; in production-like deployments the server returns 404 and
 * the page renders {@link CitationReference} guidance for re-seeding the demo.
 */
export type DemoExplainResponse = {
  generatedUtc: string;
  runId: string;
  manifestVersion: string | null;
  isDemoData: boolean;
  demoStatusMessage: string;
  runExplanation: RunExplanationSummary;
  provenanceGraph: DemoProvenanceGraph;
};
