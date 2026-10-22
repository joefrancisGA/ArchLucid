import type { Metadata } from "next";

import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  InfrastructureOverviewClient,
} from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient";

export const metadata: Metadata = {
  title: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
};

/** SecureNow infrastructure evidence hub — workbench directory. */
export default function SecureNowInfrastructureOverviewPage() {
  return <InfrastructureOverviewClient />;
}
