import { beforeEach, describe, expect, it } from "vitest";

import { invalidateOperatorHomeRunsCaches } from "@/lib/operator/operator-query-invalidation";
import { getOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

describe("operator-query-invalidation", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
  });

  it("invalidateOperatorHomeRunsCaches_invalidates_user_attention_summary", async () => {
    const queryClient = getOperatorQueryClient();
    queryClient.setQueryData(operatorQueryKeys.userAttentionSummary, {
      assignedToMeFindingsCount: 9,
      awaitingApprovalCount: 2,
      alertsOpenCount: 1,
    });

    await invalidateOperatorHomeRunsCaches();

    expect(queryClient.getQueryState(operatorQueryKeys.userAttentionSummary)?.isInvalidated).toBe(true);
  });

  it("invalidateOperatorHomeRunsCaches_invalidates_scoped_pilot_value_report_queries", async () => {
    const queryClient = getOperatorQueryClient();
    const scope = { tenantId: "t1", workspaceId: "w1", projectId: "p1" };
    const reportKey = operatorQueryKeys.pilotValueReport(scope, "open", "2026-02-01T00:00:00.000Z");
    queryClient.setQueryData(reportKey, { totalRunsCommitted: 1 });

    await invalidateOperatorHomeRunsCaches();

    expect(queryClient.getQueryState(reportKey)?.isInvalidated).toBe(true);
  });
});
