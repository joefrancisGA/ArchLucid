import GovernanceEnvironmentsClient from "@/components/governance/GovernanceEnvironmentsClient";
import { GOVERNANCE_ENVIRONMENTS_PAGE_TITLE } from "@/lib/governance/governance-environments-route";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: GOVERNANCE_ENVIRONMENTS_PAGE_TITLE,
};

export default function GovernanceEnvironmentsPage() {
  return <GovernanceEnvironmentsClient />;
}
