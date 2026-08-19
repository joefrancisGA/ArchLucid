import type { Metadata } from "next";

import { AGENT_MODEL_CATALOG_PAGE_LEAD, AGENT_MODEL_CATALOG_PAGE_TITLE } from "@/lib/agent-model-catalog-page-copy";
import { OperatorClientDrivenRouteLayout } from "@/lib/next/operator-client-driven-route-layout";

export const metadata: Metadata = {
  title: AGENT_MODEL_CATALOG_PAGE_TITLE,
  description: AGENT_MODEL_CATALOG_PAGE_LEAD,
};

export default OperatorClientDrivenRouteLayout;
