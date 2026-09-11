import { describe, expect, it } from "vitest";

import {
  resolveScorecardKpiCareerHonesty,
  SCORECARD_KPI_CAREER_BLOCKED_TITLE,
  SCORECARD_KPI_PRACTICE_SECTION_QUALIFIER,
  SCORECARD_KPI_PRACTICE_TITLE,
  SCORECARD_KPI_REHEARSAL_INCOMPLETE_TITLE,
  SCORECARD_KPI_REHEARSAL_SECTION_QUALIFIER,
  resolveScorecardKpiSectionHeading,
} from "@/lib/scorecard/scorecard-kpi-career-honesty";

describe("scorecard-kpi-career-honesty (CG-034)", () => {
  it("Career + Real has no scorecard honesty overlay", () => {
    expect(
      resolveScorecardKpiCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Career + Simulator shows blocked strip copy and rehearsal section qualifier", () => {
    const presentation = resolveScorecardKpiCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(presentation?.cellId).toBe("career-simulator-blocked");
    expect(presentation?.title).toBe(SCORECARD_KPI_CAREER_BLOCKED_TITLE);
    expect(presentation?.kpiSectionQualifier).toBe(SCORECARD_KPI_REHEARSAL_SECTION_QUALIFIER);
  });

  it("Rehearsal + Simulator uses rehearsal incomplete copy", () => {
    const presentation = resolveScorecardKpiCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-simulator");
    expect(presentation?.title).toBe(SCORECARD_KPI_REHEARSAL_INCOMPLETE_TITLE);
    expect(presentation?.kpiSectionQualifier).toBe(SCORECARD_KPI_REHEARSAL_SECTION_QUALIFIER);
  });

  it("Rehearsal + Real uses practice copy and qualifier", () => {
    const presentation = resolveScorecardKpiCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Real",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-real-practice");
    expect(presentation?.title).toBe(SCORECARD_KPI_PRACTICE_TITLE);
    expect(presentation?.kpiSectionQualifier).toBe(SCORECARD_KPI_PRACTICE_SECTION_QUALIFIER);
  });

  it("skips honesty on sample workspace", () => {
    expect(
      resolveScorecardKpiCareerHonesty({
        workingDesk: true,
        isSample: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("qualifies operational metrics heading without hiding numbers", () => {
    expect(resolveScorecardKpiSectionHeading("Operational metrics", "Rehearsal metrics")).toBe(
      "Operational metrics — Rehearsal metrics",
    );
    expect(resolveScorecardKpiSectionHeading("Operational metrics", null)).toBe("Operational metrics");
  });

  it("does not overlay on Guided desk", () => {
    expect(
      resolveScorecardKpiCareerHonesty({
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
