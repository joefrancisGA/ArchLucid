import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA } from "@/lib/architecture/architecture-intelligence-route-metadata";

export const metadata: Metadata = ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA;

export default function ArchitectureIntelligenceLayout({ children }: { children: ReactNode }) {
  return children;
}
