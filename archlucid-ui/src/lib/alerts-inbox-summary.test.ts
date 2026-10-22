import { describe, expect, it } from "vitest";

import {
  countBlockingAlerts,
  formatAlertsOpenSummaryAriaLabel,
  formatAlertsOpenSummaryValue,
  isBlockingAlertSeverity,
} from "@/lib/alerts-inbox-summary";
import type { AlertRecord } from "@/types/alerts";

describe("alerts-inbox-summary blocking semantics", () => {
  it("treats blocking severity as Critical or High only", () => {
    expect(isBlockingAlertSeverity("Critical")).toBe(true);
    expect(isBlockingAlertSeverity("High")).toBe(true);
    expect(isBlockingAlertSeverity("Warning")).toBe(false);
  });

  it("counts blocking alerts only among open Critical/High rows", () => {
    const alerts = [
      { status: "Open", severity: "Critical" },
      { status: "Open", severity: "Warning" },
      { status: "Acknowledged", severity: "Critical" },
    ] as AlertRecord[];

    expect(countBlockingAlerts(alerts)).toBe(1);
  });

  it("formats open tile value with blocking nested as a subset", () => {
    expect(formatAlertsOpenSummaryValue(3, 2)).toBe("3 open · 2 blocking");
    expect(formatAlertsOpenSummaryAriaLabel(3, 2)).toContain("3 open alerts");
    expect(formatAlertsOpenSummaryAriaLabel(3, 2)).toContain("2 blocking of open");
  });
});
