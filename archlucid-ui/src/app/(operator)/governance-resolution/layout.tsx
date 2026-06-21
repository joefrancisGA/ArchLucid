import { OperatorDataRouteLayout } from "@/lib/next/operator-data-route-layout";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store" as const;

export default OperatorDataRouteLayout;
