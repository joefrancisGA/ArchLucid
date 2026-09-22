import { describe, expect, it } from "vitest";

import {
  PACKAGE_PRINT_REHEARSAL_CAREER_DOOR_BODY,
  PACKAGE_PRINT_REHEARSAL_DOOR_BODY,
  PACKAGE_PRINT_REHEARSAL_STRIP_TITLE,
  resolvePackagePrintRehearsalHonestyStrip,
  shouldShowPackagePrintRehearsalHonestyStrip,
} from "@/lib/package-print-rehearsal-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("package-print-rehearsal-honesty (CG-023)", () => {
  it("shows rehearsal strip for Working Career simulator without career-complete stamp", () => {
    expect(
      shouldShowPackagePrintRehearsalHonestyStrip({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBe(true);

    const strip = resolvePackagePrintRehearsalHonestyStrip({
      workingDesk: true,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(strip).not.toBeNull();
    expect(strip?.title).toBe(PACKAGE_PRINT_REHEARSAL_STRIP_TITLE);
    expect(strip?.title).toMatch(/Practice/i);
    expect(strip?.body).toBe(PACKAGE_PRINT_REHEARSAL_CAREER_DOOR_BODY);
  });

  it("shows rehearsal strip for Working Rehearsal door on simulator", () => {
    const strip = resolvePackagePrintRehearsalHonestyStrip({
      workingDesk: true,
      structuralExecutionMode: StructuralExecutionModeWire.Fallback,
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(strip).not.toBeNull();
    expect(strip?.body).toBe(PACKAGE_PRINT_REHEARSAL_DOOR_BODY);
    expect(strip?.body).toMatch(/Practice/i);
  });

  it("omits rehearsal strip for Real structural mode (career-complete execute path)", () => {
    expect(
      resolvePackagePrintRehearsalHonestyStrip({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("omits rehearsal strip for sample runs and non-working desks", () => {
    expect(
      resolvePackagePrintRehearsalHonestyStrip({
        workingDesk: false,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBeNull();

    expect(
      resolvePackagePrintRehearsalHonestyStrip({
        workingDesk: true,
        isSample: true,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBeNull();
  });
});
