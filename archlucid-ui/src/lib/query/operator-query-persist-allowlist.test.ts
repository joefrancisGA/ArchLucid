import { describe, expect, it } from "vitest";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { shouldPersistOperatorQueryKey } from "@/lib/query/operator-query-persist-allowlist";

describe("operator-query-persist-allowlist (TB-2165)", () => {
  it("allows tenant, alerts, and list reads", () => {
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.tenantTrialStatus)).toBe(true);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.billingSubscriptionStatus)).toBe(true);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.alertsInboxSummary({ tenantId: "t", workspaceId: "w", projectId: "p" }))).toBe(true);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.runsByProjectPaged({ projectId: "p", page: 1, pageSize: 25 }))).toBe(true);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.complianceDriftTrend30d)).toBe(true);
  });

  it("denies authority-adjacent and audit payloads", () => {
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.sponsorRoiSummary)).toBe(false);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.corePilotCommitContext)).toBe(false);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.advisoryRecommendations({ tenantId: "t", workspaceId: "w", projectId: "p" }, "run-1"))).toBe(false);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.auditEventsSearch({ tenantId: "t", workspaceId: "w", projectId: "p" }, {}, null))).toBe(false);
    expect(shouldPersistOperatorQueryKey(operatorQueryKeys.adminAiUsageDashboard)).toBe(false);
  });
});
