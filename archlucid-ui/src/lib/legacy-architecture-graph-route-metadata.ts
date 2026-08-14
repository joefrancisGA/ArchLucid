import type { Metadata } from "next";

/**
 * Legacy `/operate/architecture-graph` bookmark — retired without HTTP redirect (IA batch 4).
 */
export const LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA: Metadata = {
  title: "Redirecting to architecture graph",
  description: "Legacy Operate architecture-graph bookmark — redirects immediately to the canonical evidence graph at /insights/evidence-graph.",
  robots: { index: false, follow: false },
};
