import { describe, expect, it } from "vitest";

import {
  buildAuditExportCsvHonestyPreambleLines,
  resolveAuditExportCareerBlockedReason,
  resolveAuditExportCareerPosture,
} from "./audit-export-career-posture";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("auditExportCareerPosture (CG-026)", () => {
  it("marks rehearsal simulator audit exports incomplete", () => {
    const posture = resolveAuditExportCareerPosture({
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      liveDoor: "rehearsal",
    });

    expect(posture.structuralExecutionMode).toBe(StructuralExecutionModeWire.Simulator);
    expect(posture.workingCareerRehearsalDoor).toBe("rehearsal");
    expect(posture.rehearsalIncomplete).toBe(true);
  });

  it("builds preamble comment lines for stamped exports", () => {
    const lines = buildAuditExportCsvHonestyPreambleLines({
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      workingCareerRehearsalDoor: "rehearsal",
      rehearsalIncomplete: true,
    });

    expect(lines[0]).toContain("CG-026");
    expect(lines.join("\n")).toContain("structuralExecutionMode=Simulator");
    expect(lines.join("\n")).toContain("rehearsalIncomplete=True");
    expect(lines.join("\n")).toContain("dualChannelHonesty=durableSqlLedgerOnly");
    expect(lines.join("\n")).toContain("dualChannelNote=");
  });

  it("blocks working career simulator audit export client-side", () => {
    const blockedReason = resolveAuditExportCareerBlockedReason({
      runId: "run-1",
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      liveDoor: "career",
      enginesSucceeded: 41,
    });

    expect(blockedReason).not.toBeNull();
  });
});
