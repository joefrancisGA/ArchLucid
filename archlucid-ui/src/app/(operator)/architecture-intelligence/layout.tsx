import type { Metadata } from "next";

import { ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA } from "@/lib/architecture-intelligence-route-metadata";

export const metadata: Metadata = ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA;

export default function ArchitectureIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
