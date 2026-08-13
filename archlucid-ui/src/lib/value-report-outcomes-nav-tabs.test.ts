import { describe, expect, it } from "vitest";

import {
  isValueReportOutcomesSurface,
  resolveVisibleValueReportOutcomesTabs,
  VALUE_REPORT_OUTCOMES_TABS,
} from "@/lib/value-report-outcomes-nav-tabs";
import {
  RETIRED_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

describe("value-report-outcomes-nav-tabs", () => {
  it("marks no tabs as internal-only", () => {
    const internalHrefs = VALUE_REPORT_OUTCOMES_TABS.filter((tab) => tab.internalOnly).map((tab) => tab.href);

    expect(internalHrefs).toEqual([]);
  });

  it("uses canonical sponsor report routes and the merged sponsor report tab label", () => {
    const visible = resolveVisibleValueReportOutcomesTabs(false);

    expect(visible.map((tab) => tab.href)).toEqual([
      SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
      SPONSOR_REPORT_ROI_SUMMARY_PATH,
      SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
    ]);
    expect(visible[0]?.label).toBe(SPONSOR_REPORT_PAGE_TITLE);
  });

  it("detects outcomes surfaces on canonical sponsor report routes", () => {
    expect(isValueReportOutcomesSurface(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH)).toBe(true);
    expect(isValueReportOutcomesSurface("/insights/architecture-scorecard")).toBe(true);
    expect(isValueReportOutcomesSurface("/value-report/pilot")).toBe(false);
    expect(isValueReportOutcomesSurface("/architecture/reviews")).toBe(false);
  });

  it("drops the retired pilot outcomes tab after the merge", () => {
    expect(VALUE_REPORT_OUTCOMES_TABS.map((tab) => tab.href)).not.toContain(RETIRED_PILOT_OUTCOMES_PATH);
    expect(isValueReportOutcomesSurface(RETIRED_PILOT_OUTCOMES_PATH)).toBe(false);
  });
});
