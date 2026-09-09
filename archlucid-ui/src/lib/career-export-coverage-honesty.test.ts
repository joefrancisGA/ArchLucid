import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE } from "@/lib/architecture/architecture-inventory-estate-gap-copy";
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
    expect(honesty.measurementFloorBlockedReason).toContain(
      "not a fully governed review record",
    );
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

  it("includes inventory estate gap markdown when architecture inventory is unbound (AS-051)", () => {
    const markdown = formatCareerExportHonestyMarkdown({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      architectureInventoryBound: false,
    });

    expect(markdown).toContain(ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE);
    expect(markdown).toMatch(/Inventory estate/i);
  });

  it("formats shared markdown with measurement floor and classification bands", () => {
    const markdown = formatCareerExportHonestyMarkdown({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: {
        manifestId: "m-1",
        status: "Committed",
        ruleSetId: "pack",
        ruleSetVersion: "1",
        manifestHash: "hash",
        decisionCount: 1,
        warningCount: 0,
        unresolvedIssueCount: 0,
        feasibilityVerdict: {
          kind: "Feasible",
          summary: "ok",
          transparencyTrail: {
            asserted: [],
            inferred: [],
            skipped: [{ questionKey: "drRpo", tier: "Must" }],
          },
        },
      } as never,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      classificationCounts: { decisionGrade: 4, checklist: 2 },
    });

    expect(markdown).toMatch(/Measurement floor/i);
    expect(markdown).toMatch(/Decision-grade: 4/i);
    expect(markdown).toMatch(/Checklist: 2/i);
    expect(markdown).toMatch(/Skipped required questions/i);
    expect(markdown).toMatch(/drRpo/);
  });

  it("blocks export when skipped must questions are present on the manifest trail", () => {
    expect(
      resolveCareerExportBlockedReason({
        runId: "run-1",
        progressSummary: null,
        manifestSummary: {
          manifestId: "m-1",
          status: "Committed",
          ruleSetId: "pack",
          ruleSetVersion: "1",
          manifestHash: "hash",
          decisionCount: 1,
          warningCount: 0,
          unresolvedIssueCount: 0,
          feasibilityVerdict: {
            kind: "Feasible",
            summary: "ok",
            transparencyTrail: {
              asserted: [],
              inferred: [],
              skipped: [{ questionKey: "drRpo", tier: "Must" }],
            },
          },
        } as never,
        graphSnapshot: null,
        enginesSucceeded: 16,
        workingDesk: true,
      }),
    ).toMatch(/required intake questions are unanswered/i);
  });

  it("returns a blocked reason helper for manifest export gates", () => {
    expect(
      resolveCareerExportBlockedReason({
        runId: "run-1",
        progressSummary: null,
        manifestSummary: {
          manifestId: "m-1",
          status: "Committed",
          ruleSetId: "pack",
          ruleSetVersion: "1",
          manifestHash: "hash",
          decisionCount: 1,
          warningCount: 0,
          unresolvedIssueCount: 0,
          feasibilityVerdict: {
            kind: "Feasible",
            summary: "ok",
            transparencyTrail: { asserted: [], inferred: [], skipped: [] },
          },
        } as never,
        graphSnapshot: null,
        enginesSucceeded: 5,
        workingDesk: true,
      }),
    ).toContain("measurement floor");
  });

  it("derives judge cap skips from findings snapshot when explicit count is omitted", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: null,
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 16,
      workingDesk: true,
      findingsSnapshot: {
        insightDensityCuration: {
          judgeSkippedByCap: 2,
        },
      },
    });

    expect(honesty.measurementFloor.judgeSkippedByCap).toBe(2);
    expect(honesty.measurementFloor.line).toContain("skipped 2 findings by per-snapshot cap");
  });

  it("names skipped actor engines when graph has no actors and analysis is complete", () => {
    const honesty = resolveCareerExportCoverageHonesty({
      runId: "run-1",
      progressSummary: {
        runId: "run-1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00Z",
        hasFindingsSnapshot: true,
        hasGraphSnapshot: true,
        hasContextSnapshot: true,
      },
      manifestSummary: null,
      graphSnapshot: { nodes: [] },
      enginesSucceeded: 12,
      workingDesk: true,
    });

    expect(honesty.measurementFloor.skippedActorEngineTypes).toEqual([
      "external-exposure",
      "trust-boundary",
      "privileged-access",
    ]);
    expect(honesty.measurementFloor.line).toContain("no Actor nodes");
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
