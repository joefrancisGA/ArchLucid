import { describe, expect, it } from "vitest";

import {
  formatCareerAdrExportRehearsalHeaderMarkdown,
  resolveCareerAdrExportRehearsalHeader,
} from "@/lib/career-artifact/format-career-adr-export-rehearsal-header-markdown";
import { PACKAGE_PRINT_REHEARSAL_STRIP_TITLE } from "@/lib/package-print-rehearsal-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("formatCareerAdrExportRehearsalHeaderMarkdown (CG-024)", () => {
  it("prepends rehearsal header markdown for Working Career simulator stamp", () => {
    const markdown = formatCareerAdrExportRehearsalHeaderMarkdown({
      workingDesk: true,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(markdown).not.toBeNull();
    expect(markdown).toContain(`## ${PACKAGE_PRINT_REHEARSAL_STRIP_TITLE}`);
    expect(markdown).toMatch(/Simulator/i);
  });

  it("returns rehearsal header for Working Rehearsal door on simulator", () => {
    const strip = resolveCareerAdrExportRehearsalHeader({
      workingDesk: true,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(strip).not.toBeNull();
    expect(strip?.title).toMatch(/Rehearsal/i);
  });

  it("omits header for Real structural mode", () => {
    expect(
      formatCareerAdrExportRehearsalHeaderMarkdown({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
