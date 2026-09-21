import { Suspense } from "react";
import type { Metadata } from "next";

import { GovernanceFindingsQueueSkeleton } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueSkeleton";
import { GovernanceFindingsQueueClientDeferred } from "@/app/(operator)/governance/findings/governance-findings-deferred-chunks";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.findings,
};

/** SecureNow tenant findings queue. */
export default function SecureNowFindingsPage() {
  return (
    <Suspense fallback={<GovernanceFindingsQueueSkeleton />}>
      <GovernanceFindingsQueueClientDeferred />
    </Suspense>
  );
}
