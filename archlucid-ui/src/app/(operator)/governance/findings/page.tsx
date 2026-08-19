import dynamic from "next/dynamic";
import { Suspense } from "react";

import { GovernanceFindingsQueueSkeleton } from "./GovernanceFindingsQueueSkeleton";

const GovernanceFindingsQueueClient = dynamic(
  () => import("./GovernanceFindingsQueueClient"),
  { loading: () => <GovernanceFindingsQueueSkeleton /> },
);

/** Governance findings hub with deferred queue chunk (TB-571). */
export default function GovernanceFindingsPage() {
  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClient />
    </Suspense>
  );
}
