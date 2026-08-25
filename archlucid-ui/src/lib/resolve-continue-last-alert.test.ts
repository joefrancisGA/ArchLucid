import { describe, expect, it } from "vitest";

import { resolveContinueLastAlert } from "@/lib/resolve-continue-last-alert";
import type { AlertRecord } from "@/types/alerts";

function alert(overrides: Partial<AlertRecord> = {}): AlertRecord {
  return {
    alertId: "alert-1",
    ruleId: "rule-1",
    title: "Cost spike",
    category: "Cost",
    severity: "High",
    status: "Open",
    triggerValue: "12",
    description: "Cost increased",
    createdUtc: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveContinueLastAlert", () => {
  it("falls back to the oldest unread alert when no stored id exists", () => {
    const match = resolveContinueLastAlert([
      alert({ alertId: "newer", title: "Newer", createdUtc: "2026-08-20T00:00:00.000Z", status: "Open" }),
      alert({ alertId: "older", title: "Older", createdUtc: "2026-08-01T00:00:00.000Z", status: "Open" }),
      alert({
        alertId: "resolved",
        title: "Resolved",
        createdUtc: "2026-07-01T00:00:00.000Z",
        status: "Resolved",
      }),
    ]);

    expect(match?.alertId).toBe("older");
    expect(match?.title).toBe("Older");
  });
});
