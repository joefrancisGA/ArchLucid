import dynamic from "next/dynamic";
import { Suspense } from "react";

import { GovernanceFindingsQueueSkeleton } from "../GovernanceFindingsQueueSkeleton";

const GovernanceFindingsQueueClient = dynamic(
  () => import("../GovernanceFindingsQueueClient"),
  { loading: () => <GovernanceFindingsQueueSkeleton /> },
);

/** Personal assigned-to-me findings queue (TB-2195). */
export default function AssignedToMeFindingsPage() {
  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClient mode="assigned-to-me" />
    </Suspense>
  );
}
