import type { Metadata } from "next";

import { EVIDENCE_GRAPH_ROUTE_METADATA } from "@/lib/evidence-graph-route-metadata";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = EVIDENCE_GRAPH_ROUTE_METADATA;

export default OperatorClientDrivenRouteLayout;
