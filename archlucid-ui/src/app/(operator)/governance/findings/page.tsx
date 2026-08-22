import { Suspense } from "react";

import { GovernanceFindingsQueueSkeleton } from "./GovernanceFindingsQueueSkeleton";

import { GovernanceFindingsQueueClientDeferred } from "./governance-findings-deferred-chunks";

/** Governance findings hub with deferred queue chunk (TB-571). */
export default function GovernanceFindingsPage() {
  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClientDeferred />
    </Suspense>
  );
}
