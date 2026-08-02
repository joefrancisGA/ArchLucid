import type { Metadata } from "next";

import { ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA } from "@/lib/administration-system-health-route-metadata";
import { OperatorDataRouteLayout } from "@/lib/next/operator-data-route-layout";

export const metadata: Metadata = ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default OperatorDataRouteLayout;
