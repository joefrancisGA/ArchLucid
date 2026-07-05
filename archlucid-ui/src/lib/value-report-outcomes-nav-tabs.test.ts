import { describe, expect, it } from "vitest";

import {
  isValueReportOutcomesSurface,
  resolveVisibleValueReportOutcomesTabs,
  VALUE_REPORT_OUTCOMES_TABS,
} from "@/lib/value-report-outcomes-nav-tabs";

describe("value-report-outcomes-nav-tabs", () => {
  it("marks no tabs as internal-only (Pilot outcomes and ROI summary promoted to customer-facing, TB-605 superseded)", () => {
    const internalHrefs = VALUE_REPORT_OUTCOMES_TABS.filter((tab) => tab.internalOnly).map((tab) => tab.href);

    expect(internalHrefs).toEqual([]);
  });

  it("shows every tab regardless of system-administration nav flag", () => {
    const visible = resolveVisibleValueReportOutcomesTabs(false);

    expect(visible.map((tab) => tab.href)).toEqual([
      "/value-report",
      "/value-report/pilot",
      "/value-report/roi",
      "/scorecard",
    ]);
  });

  it("shows all tabs when system-administration nav is enabled", () => {
    const visible = resolveVisibleValueReportOutcomesTabs(true);

    expect(visible.map((tab) => tab.href)).toEqual([
      "/value-report",
      "/value-report/pilot",
      "/value-report/roi",
      "/scorecard",
    ]);
  });

  it("detects outcomes surfaces across sponsor, internal, and scorecard routes", () => {
    expect(isValueReportOutcomesSurface("/value-report")).toBe(true);
    expect(isValueReportOutcomesSurface("/value-report/pilot")).toBe(true);
    expect(isValueReportOutcomesSurface("/value-report/roi")).toBe(true);
    expect(isValueReportOutcomesSurface("/scorecard")).toBe(true);
    expect(isValueReportOutcomesSurface("/reviews")).toBe(false);
  });
});
