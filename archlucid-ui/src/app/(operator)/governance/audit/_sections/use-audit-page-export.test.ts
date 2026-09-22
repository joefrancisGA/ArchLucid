import { describe, expect, it } from "vitest";

import { resolveAuditPageExportCareerContext } from "./use-audit-page-export";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("resolveAuditPageExportCareerContext", () => {
  it("returns null posture when runId filter is empty", () => {
    expect(
      resolveAuditPageExportCareerContext({
        runId: "",
        progressSummary: null,
        liveDoor: "career",
        workingDesk: true,
      }),
    ).toEqual({ auditExportPosture: null, blockedReason: null });
  });

  it("stamps posture when runId filter is set", () => {
    const result = resolveAuditPageExportCareerContext({
      runId: "run-1",
      progressSummary: {
        runId: "run-1",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        workingCareerRehearsalDoor: "rehearsal",
      },
      liveDoor: "rehearsal",
      workingDesk: false,
    });

    expect(result.blockedReason).toBeNull();
    expect(result.auditExportPosture).toEqual({
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      workingCareerRehearsalDoor: "rehearsal",
      rehearsalIncomplete: true,
    });
  });

  it("blocks Working career simulator audit export when runId filter is set", () => {
    const result = resolveAuditPageExportCareerContext({
      runId: "run-1",
      progressSummary: {
        runId: "run-1",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        workingCareerRehearsalDoor: "career",
      },
      liveDoor: "career",
      workingDesk: true,
    });

    expect(result.auditExportPosture).toBeNull();
    expect(result.blockedReason).not.toBeNull();
  });
});
