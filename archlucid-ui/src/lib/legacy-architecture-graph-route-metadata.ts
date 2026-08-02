import type { Metadata } from "next";

/**
 * Legacy `/operate/architecture-graph` is a redirect shim — not a second graph product page (TB-1807).
 */
export const LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA: Metadata = {
  title: "Redirecting to architecture graph",
  description: "Legacy Operate architecture-graph bookmark — redirects immediately to the canonical evidence graph viewer.",
  robots: { index: false, follow: false },
};
