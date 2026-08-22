import type { Metadata } from "next";
import { Suspense } from "react";

import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";

import { GovernanceWorkflowPageContentDeferred } from "../_sections/governance-workflow-deferred-chunks";
import { GovernanceWorkflowSuspenseFallback } from "../_sections/GovernanceWorkflowSuspenseFallback";

export const metadata: Metadata = {
  title: GOVERNANCE_OVERVIEW_PAGE_TITLE,
};

/** Governance approval queue with deferred workflow client chunk (TB-934). */
export default function GovernanceApprovalQueuePage() {
  return (
    <Suspense fallback={<GovernanceWorkflowSuspenseFallback />}>
      <GovernanceWorkflowPageContentDeferred />
    </Suspense>
  );
}
