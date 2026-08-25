import { describe, expect, it } from "vitest";

import { resolveAlertsInboxTriageFirstAlert } from "@/lib/resolve-alerts-inbox-triage-first-alert";
import type { AlertRecord } from "@/types/alerts";

function alert(overrides: Partial<AlertRecord> = {}): AlertRecord {
  return {
    alertId: "alert-a",
    ruleId: "rule-a",
    title: "Alert A",
    category: "governance",
    severity: "Medium",
    status: "Open",
    triggerValue: "1",
    description: "desc",
    createdUtc: "2026-08-24T12:00:00.000Z",
    ...overrides,
  };
}

describe("resolveAlertsInboxTriageFirstAlert", () => {
  it("prefers highest-severity open alert", () => {
    const target = resolveAlertsInboxTriageFirstAlert([
      alert({ alertId: "low", severity: "Low", createdUtc: "2026-08-24T10:00:00.000Z" }),
      alert({ alertId: "critical", severity: "Critical", createdUtc: "2026-08-24T11:00:00.000Z" }),
    ]);

    expect(target?.alertId).toBe("critical");
  });

  it("returns null when no open alerts remain", () => {
    expect(
      resolveAlertsInboxTriageFirstAlert([alert({ status: "Acknowledged" })]),
    ).toBeNull();
  });
});
