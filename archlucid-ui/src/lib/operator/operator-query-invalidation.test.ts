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
});
