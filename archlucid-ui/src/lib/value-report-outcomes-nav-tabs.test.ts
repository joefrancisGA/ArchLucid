import { describe, expect, it } from "vitest";

import {
  isValueReportOutcomesSurface,
  resolveVisibleValueReportOutcomesTabs,
  VALUE_REPORT_OUTCOMES_TABS,
} from "@/lib/value-report-outcomes-nav-tabs";

describe("value-report-outcomes-nav-tabs", () => {
  it("marks pilot and ROI tabs as internal-only", () => {
    const internalHrefs = VALUE_REPORT_OUTCOMES_TABS.filter((tab) => tab.internalOnly).map((tab) => tab.href);

    expect(internalHrefs).toEqual(["/value-report/pilot", "/value-report/roi"]);
  });

  it("hides internal-only tabs when system-administration nav is disabled", () => {
    const visible = resolveVisibleValueReportOutcomesTabs(false);

    expect(visible.map((tab) => tab.href)).toEqual(["/value-report", "/scorecard"]);
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
