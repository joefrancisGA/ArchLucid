"use client";

import { Suspense } from "react";

import { GovernanceWorkflowPageContent } from "../_sections/GovernanceWorkflowPageContent";
import { GovernanceWorkflowSuspenseFallback } from "../_sections/GovernanceWorkflowSuspenseFallback";

export default function GovernanceApprovalQueuePage() {
  return (
    <Suspense fallback={<GovernanceWorkflowSuspenseFallback />}>
      <GovernanceWorkflowPageContent />
    </Suspense>
  );
}
