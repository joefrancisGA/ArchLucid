import { describe, expect, it } from "vitest";

import {
  isValueReportOutcomesSurface,
  resolveVisibleValueReportOutcomesTabs,
  VALUE_REPORT_OUTCOMES_TABS,
} from "@/lib/value-report-outcomes-nav-tabs";
import {
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

describe("value-report-outcomes-nav-tabs", () => {
  it("marks no tabs as internal-only", () => {
    const internalHrefs = VALUE_REPORT_OUTCOMES_TABS.filter((tab) => tab.internalOnly).map((tab) => tab.href);

    expect(internalHrefs).toEqual([]);
  });

  it("uses canonical sponsor report routes and executive summary tab label", () => {
    const visible = resolveVisibleValueReportOutcomesTabs(false);

    expect(visible.map((tab) => tab.href)).toEqual([
      SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
      SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
      SPONSOR_REPORT_ROI_SUMMARY_PATH,
      SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
    ]);
    expect(visible[0]?.label).toBe("Executive summary");
    expect(visible[1]?.label).toBe("Pilot outcomes");
  });

  it("detects outcomes surfaces across canonical and legacy routes", () => {
    expect(isValueReportOutcomesSurface(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH)).toBe(true);
    expect(isValueReportOutcomesSurface(SPONSOR_REPORT_PILOT_OUTCOMES_PATH)).toBe(true);
    expect(isValueReportOutcomesSurface("/value-report/pilot")).toBe(true);
    expect(isValueReportOutcomesSurface("/value-report/roi")).toBe(true);
    expect(isValueReportOutcomesSurface("/scorecard")).toBe(true);
    expect(isValueReportOutcomesSurface("/reviews")).toBe(false);
  });
});
