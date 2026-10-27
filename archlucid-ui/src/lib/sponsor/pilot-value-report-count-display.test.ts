import { describe, expect, it } from "vitest";

import {
  pilotValueReportMaterialFindingsDisplay,
  pilotValueReportSeverityCountDisplay,
  pilotValueReportTotalFindingsDisplay,
} from "@/lib/sponsor/pilot-value-report-count-display";

describe("pilot-value-report-count-display", () => {
  it("labels omitted severity counts", () => {
    expect(pilotValueReportSeverityCountDisplay(undefined, "Critical")).toContain("not stored");
    expect(pilotValueReportSeverityCountDisplay(2, "High")).toBe("2");
  });

  it("labels omitted totals and material sums", () => {
    expect(pilotValueReportTotalFindingsDisplay(undefined)).toContain("not stored");
    expect(pilotValueReportMaterialFindingsDisplay(undefined, 1)).toContain("not stored");
    expect(pilotValueReportMaterialFindingsDisplay(1, 2)).toBe("3");
  });
});
