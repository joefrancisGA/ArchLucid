import { describe, expect, it } from "vitest";

import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

import {
  capValueReportContributingRunIds,
  periodContributingRunsRequireHonesty,
  resolveValueReportCareerHonesty,
  resolveValueReportScopedCareerHonesty,
  shouldApplyValueReportRehearsalHonesty,
  VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER,
  VALUE_REPORT_PERIOD_MIX_TITLE,
  VALUE_REPORT_SCOPED_REHEARSAL_INCOMPLETE_TITLE,
} from "@/lib/insights/value-report-career-honesty";

describe("value-report-career-honesty (CG-090)", () => {
  it("skips honesty for Record review type + Real contributing runs", () => {
    expect(
      shouldApplyValueReportRehearsalHonesty({
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        workingCareerRehearsalDoor: "career",
      }),
    ).toBe(false);
  });

  it("requires honesty for Simulator runs on the Career door", () => {
    expect(
      shouldApplyValueReportRehearsalHonesty({
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        workingCareerRehearsalDoor: "career",
      }),
    ).toBe(true);
  });

  it("resolves scoped rehearsal presentation for Rehearsal door + Simulator", () => {
    const presentation = resolveValueReportScopedCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.title).toBe(VALUE_REPORT_SCOPED_REHEARSAL_INCOMPLETE_TITLE);
    expect(presentation?.body).toContain("not record-complete");
  });

  it("shows period-mix honesty when any contributing run requires rehearsal labeling", () => {
    const presentation = resolveValueReportCareerHonesty({
      isSample: false,
      scopedHonesty: null,
      periodRequiresHonesty: true,
    });

    expect(presentation?.kind).toBe("period-mix");
    expect(presentation?.title).toBe(VALUE_REPORT_PERIOD_MIX_TITLE);
  });

  it("prefers scoped honesty over period mix", () => {
    const scoped = resolveValueReportScopedCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    const presentation = resolveValueReportCareerHonesty({
      isSample: false,
      scopedHonesty: scoped,
      periodRequiresHonesty: true,
    });

    expect(presentation?.kind).toBe("scoped");
  });

  it("caps contributing run lookups for period honesty", () => {
    const capped = capValueReportContributingRunIds(
      Array.from({ length: 15 }, (_, index) => `run-${index}`),
    );

    expect(capped).toHaveLength(10);
    expect(capped[0]).toBe("run-0");
    expect(capped[9]).toBe("run-9");
  });

  it("does not claim measured savings in disclaimer copy", () => {
    expect(VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER).toContain("not measured procurement savings");
    expect(VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER).toContain("G-REAL-06");
  });
});
