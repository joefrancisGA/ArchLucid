import type { Metadata } from "next";

import { LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA } from "@/lib/legacy-architecture-graph-route-metadata";

export const metadata: Metadata = LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA;

export default function LegacyArchitectureGraphLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
