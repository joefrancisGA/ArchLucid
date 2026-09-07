import { describe, expect, it } from "vitest";

import {
  formatCareerExportClassificationBandLine,
  formatCareerExportHonestyMarkdown,
  formatCareerExportHonestyPlainText,
  resolveCareerExportBlockedReason,
  resolveCareerExportCoverageHonesty,
} from "@/lib/career-export-coverage-honesty";

describe("career-export-coverage-honesty (PC-13)", () => {
  it("blocks Working career export when measurement count is unknown", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: null,
      workingDesk: true,
    });

    expect(honesty.blockedForWorkingCareerExport).toBe(true);
    expect(honesty.measurementFloorBlockedReason).toContain("not been measured");
  });

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

  it("blocks Working career export when a catalog advisory engine failed", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      catalogAdvisoryEngineFailureCount: 1,
    });

    expect(honesty.blockedForWorkingCareerExport).toBe(true);
    expect(honesty.measurementFloorBlockedReason).toContain("catalog engine failed");
  });

  it("blocks Working career export when pre-finalize governance gate is disabled", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      preCommitGateEnabled: false,
    });

    expect(honesty.blockedForWorkingCareerExport).toBe(true);
    expect(honesty.measurementFloorBlockedReason).toContain("Pre-finalize governance gate is off");
  });

  it("blocks Working career export when quality gate is WarnOnly on real-mode", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      structuralExecutionMode: "Real",
      hostAgentExecutionMode: "Real",
      hostQualityGateMode: "WarnOnly",
    });

    expect(honesty.blockedForWorkingCareerExport).toBe(true);
    expect(honesty.measurementFloorBlockedReason).toContain("Quality gate is WarnOnly");
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

  it("formats shared markdown with measurement floor and classification bands", () => {
    const markdown = formatCareerExportHonestyMarkdown({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      classificationCounts: { decisionGrade: 4, checklist: 2 },
    });

    expect(markdown).toMatch(/Measurement floor/i);
    expect(markdown).toMatch(/Decision-grade: 4/i);
    expect(markdown).toMatch(/Checklist: 2/i);
  });

  it("returns a blocked reason helper for manifest export gates", () => {
    expect(
      resolveCareerExportBlockedReason({
        runId: "run-1",
        progressSummary: null,
        manifestSummary: null,
        graphSnapshot: null,
        enginesSucceeded: 5,
        workingDesk: true,
      }),
    ).toContain("measurement floor");
  });

  it("strips markdown for print surfaces", () => {
    const plain = formatCareerExportHonestyPlainText({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      classificationCounts: { decisionGrade: 1, checklist: 0 },
    });

    expect(plain).not.toMatch(/^#/m);
    expect(plain).toMatch(/Measurement floor/i);
    expect(formatCareerExportClassificationBandLine({ decisionGrade: 1, checklist: 0 })).toMatch(
      /Decision-grade: 1/i,
    );
  });
});
