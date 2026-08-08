import type { Metadata } from "next";

import { FIRST_REVIEW_GUIDE_ROUTE_METADATA } from "@/lib/first-review-guide-route-metadata";

import { OperatorDataRouteLayout } from "@/lib/next/operator-data-route-layout";

export const metadata: Metadata = FIRST_REVIEW_GUIDE_ROUTE_METADATA;

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const fetchCache = "force-no-store";

export default OperatorDataRouteLayout;

