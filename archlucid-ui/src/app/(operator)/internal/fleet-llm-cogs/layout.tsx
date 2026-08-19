import type { Metadata } from "next";

import { FLEET_LLM_COGS_ROUTE_METADATA } from "@/lib/fleet-llm-cogs-route-metadata";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = FLEET_LLM_COGS_ROUTE_METADATA;

export default OperatorClientDrivenRouteLayout;
