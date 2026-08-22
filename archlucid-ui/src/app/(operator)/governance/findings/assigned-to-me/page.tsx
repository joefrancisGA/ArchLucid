import { Suspense } from "react";

import { GovernanceFindingsQueueSkeleton } from "../GovernanceFindingsQueueSkeleton";

import { GovernanceFindingsQueueClientDeferred } from "../governance-findings-deferred-chunks";

/** Personal assigned-to-me findings queue (TB-2195). */
export default function AssignedToMeFindingsPage() {
  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClientDeferred mode="assigned-to-me" />
    </Suspense>
  );
}
