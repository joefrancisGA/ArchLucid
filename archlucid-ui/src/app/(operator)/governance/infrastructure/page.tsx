import type { Metadata } from "next";

import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  InfrastructureOverviewClient,
} from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient";

export const metadata: Metadata = {
  title: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
};

/** IE-UX-00 infrastructure evidence hub — workbench directory until IE-UX-01..05 land. */
export default function InfrastructureOverviewPage() {
  return <InfrastructureOverviewClient />;
}
