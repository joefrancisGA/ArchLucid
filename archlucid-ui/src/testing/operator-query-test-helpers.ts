import { beforeEach } from "vitest";

import { invalidateHealthReadySummaryCache } from "@/lib/health-ready-client";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { invalidateTenantTrialStatusCache } from "@/lib/tenant-trial-status-client";

/** Resets TanStack Query state before each test that renders operator shell query hooks. */
export function useOperatorQueryTestLifecycle(): void {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateHealthReadySummaryCache();
    await invalidateTenantTrialStatusCache();
  });
}
