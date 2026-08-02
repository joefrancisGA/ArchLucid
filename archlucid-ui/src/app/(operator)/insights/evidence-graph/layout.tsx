import type { Metadata } from "next";
import type { ReactNode } from "react";

import { EVIDENCE_GRAPH_ROUTE_METADATA } from "@/lib/evidence-graph-route-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = EVIDENCE_GRAPH_ROUTE_METADATA;

export default function GraphLayout({ children }: { children: ReactNode }) {
  return children;
}
