import { describe, expect, it } from "vitest";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

describe("operatorQueryKeys alerts inbox (TB-935)", () => {
  const scope = { tenantId: "t1", workspaceId: "w1", projectId: "default" };

  it("scopes inbox page queries by status filter and cursor", () => {
    expect(operatorQueryKeys.alertsInboxPage(scope, { statusFilter: "Open", cursor: "abc" })).toEqual([
      "operator",
      "alerts",
      "inbox-page",
      scope,
      { statusFilter: "Open", cursor: "abc" },
    ]);
  });

  it("scopes summary and workspace context separately", () => {
    expect(operatorQueryKeys.alertsInboxSummary(scope)).toEqual([
      "operator",
      "alerts",
      "inbox-summary",
      scope,
    ]);
    expect(operatorQueryKeys.alertsInboxWorkspaceContext(scope)).toEqual([
      "operator",
      "alerts",
      "workspace-context",
      scope,
    ]);
  });
});

describe("operatorQueryKeys billing subscription (TB-2144)", () => {
  it("uses a stable tenant-scoped billing subscription key", () => {
    expect(operatorQueryKeys.billingSubscriptionStatus).toEqual([
      "operator",
      "tenant",
      "billing-subscription-status",
    ]);
  });
});

describe("operatorQueryKeys governance reviews awaiting action (TB-2144)", () => {
  const scope = { tenantId: "t1", workspaceId: "w1", projectId: "default" };

  it("scopes awaiting-action queries by operator scope", () => {
    expect(operatorQueryKeys.governanceReviewsAwaitingAction(scope)).toEqual([
      "operator",
      "governance",
      "reviews-awaiting-action",
      scope,
    ]);
  });
});
