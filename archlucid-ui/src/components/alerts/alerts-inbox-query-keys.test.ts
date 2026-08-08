import { describe, expect, it } from "vitest";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

describe("operatorQueryKeys alerts inbox (TB-935)", () => {
  const scope = { tenantId: "t1", workspaceId: "w1", projectId: "default" };

  it("scopes inbox page queries by status filter and page", () => {
    expect(operatorQueryKeys.alertsInboxPage(scope, { statusFilter: "Open", page: 2 })).toEqual([
      "operator",
      "alerts",
      "inbox-page",
      scope,
      { statusFilter: "Open", page: 2 },
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
