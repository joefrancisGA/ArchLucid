import { describe, expect, it } from "vitest";

import {
  resolveRoiTileCareerHonesty,
  resolveRoiTileSectionHeading,
  ROI_TILE_CAREER_BLOCKED_TITLE,
  ROI_TILE_PRACTICE_SECTION_QUALIFIER,
  ROI_TILE_PRACTICE_TITLE,
  ROI_TILE_REHEARSAL_INCOMPLETE_TITLE,
  ROI_TILE_REHEARSAL_SECTION_QUALIFIER,
} from "@/lib/roi/roi-tile-career-honesty";

describe("roi-tile-career-honesty (CG-035)", () => {
  it("Career + Real has no ROI honesty overlay", () => {
    expect(
      resolveRoiTileCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Career + Simulator shows blocked ROI copy", () => {
    const presentation = resolveRoiTileCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(presentation?.cellId).toBe("career-simulator-blocked");
    expect(presentation?.title).toBe(ROI_TILE_CAREER_BLOCKED_TITLE);
    expect(presentation?.roiSectionQualifier).toBe(ROI_TILE_REHEARSAL_SECTION_QUALIFIER);
  });

  it("Rehearsal + Simulator uses rehearsal incomplete copy", () => {
    const presentation = resolveRoiTileCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-simulator");
    expect(presentation?.title).toBe(ROI_TILE_REHEARSAL_INCOMPLETE_TITLE);
  });

  it("Rehearsal + Real uses practice copy", () => {
    const presentation = resolveRoiTileCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Real",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-real-practice");
    expect(presentation?.title).toBe(ROI_TILE_PRACTICE_TITLE);
    expect(presentation?.roiSectionQualifier).toBe(ROI_TILE_PRACTICE_SECTION_QUALIFIER);
  });

  it("skips honesty on sample workspace", () => {
    expect(
      resolveRoiTileCareerHonesty({
        workingDesk: true,
        isSample: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("qualifies ROI section headings without hiding numbers", () => {
    expect(resolveRoiTileSectionHeading("Value at a glance", "Rehearsal ROI")).toBe(
      "Value at a glance — Rehearsal ROI",
    );
    expect(resolveRoiTileSectionHeading("Value at a glance", null)).toBe("Value at a glance");
  });
});
