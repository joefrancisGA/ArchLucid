import { Suspense } from "react";

import { GovernanceFindingsQueueSkeleton } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueSkeleton";
import { GovernanceFindingsQueueClientDeferred } from "@/app/(operator)/governance/findings/governance-findings-deferred-chunks";

/** SecureNow personal assigned-to-me findings queue. */
export default function SecureNowAssignedToMeFindingsPage() {
  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClientDeferred mode="assigned-to-me" />
    </Suspense>
  );
}
