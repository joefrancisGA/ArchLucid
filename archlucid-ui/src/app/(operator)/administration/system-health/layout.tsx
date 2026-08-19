import type { Metadata } from "next";

import { ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA } from "@/lib/administration-system-health-route-metadata";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA;

export default OperatorClientDrivenRouteLayout;
