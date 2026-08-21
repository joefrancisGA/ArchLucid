import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";

import { GovernanceWorkflowSuspenseFallback } from "../_sections/GovernanceWorkflowSuspenseFallback";

const GovernanceWorkflowPageContent = dynamic(
  () => import("../_sections/GovernanceWorkflowPageContent").then((module) => module.GovernanceWorkflowPageContent),
  {
    loading: () => (
      <div
        className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        role="status"
        aria-label="Loading approval workflow"
        data-testid="governance-workflow-chunk-loading"
      />
    ),
  },
);

export const metadata: Metadata = {
  title: GOVERNANCE_OVERVIEW_PAGE_TITLE,
};

/** Governance approval queue with deferred workflow client chunk (TB-934). */
export default function GovernanceApprovalQueuePage() {
  return (
    <Suspense fallback={<GovernanceWorkflowSuspenseFallback />}>
      <GovernanceWorkflowPageContent />
    </Suspense>
  );
}
