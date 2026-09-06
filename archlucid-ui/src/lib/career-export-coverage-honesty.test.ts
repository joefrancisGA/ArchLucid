import { describe, expect, it } from "vitest";

import { resolveCareerExportCoverageHonesty } from "@/lib/career-export-coverage-honesty";

describe("career-export-coverage-honesty (PC-13)", () => {
  it("blocks Working career export when measurement floor is unmet", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 8,
      workingDesk: true,
    });

    expect(honesty.blockedForWorkingCareerExport).toBe(true);
    expect(honesty.measurementFloorBlockedReason).toContain("measurement floor");
  });

  it("allows Guided sample exports without Working floor enforcement", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 4,
      workingDesk: false,
    });

    expect(honesty.blockedForWorkingCareerExport).toBe(false);
  });
});
