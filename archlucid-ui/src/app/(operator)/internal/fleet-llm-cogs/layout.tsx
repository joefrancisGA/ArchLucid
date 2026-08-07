import type { Metadata } from "next";

import { FLEET_LLM_COGS_ROUTE_METADATA } from "@/lib/fleet-llm-cogs-route-metadata";
import { OperatorDataRouteLayout } from "@/lib/next/operator-data-route-layout";

export const metadata: Metadata = FLEET_LLM_COGS_ROUTE_METADATA;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default OperatorDataRouteLayout;
