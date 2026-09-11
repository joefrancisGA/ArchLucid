import { describe, expect, it } from "vitest";

import {
  resolveWorkingCareerDoorGate,
} from "@/lib/governance/working-career-door-gate";
import {
  WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
} from "@/lib/governance/working-career-door-gate-copy";
import {
  resolveWorkingCareerDoorHostModeMatrixCell,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CELL_IDS,
} from "@/lib/governance/working-career-door-host-mode-matrix";
import {
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_DETAIL,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_SIMULATOR_DETAIL,
} from "@/lib/governance/working-career-door-host-mode-matrix-copy";

describe("working-career-door-host-mode-matrix (CG-020 / AS-084)", () => {
  it("names all four matrix cells", () => {
    expect(WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CELL_IDS).toEqual([
      "career-real",
      "career-simulator-blocked",
      "rehearsal-simulator",
      "rehearsal-real-practice",
    ]);
  });

  it("Career + Real is not blocked and does not show a mismatch tag", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "career",
      hostMode: "Real",
      sessionMode: "Real",
      isSessionReal: true,
      isLiveAiReady: true,
      isLoading: false,
    });
    const presentation = resolveWorkingCareerDoorHostModeMatrixCell({
      selectedDoor: "career",
      gate,
      isSessionReal: true,
      hostMode: "Real",
      sessionMode: "Real",
    });

    expect(presentation.cellId).toBe("career-real");
    expect(presentation.isCareerExecuteBlocked).toBe(false);
    expect(presentation.showStatusTag).toBe(false);
    expect(presentation.effectiveDoor).toBe("career");
    expect(presentation.labelAsRehearsal).toBe(false);
  });

  it("Career + Simulator is blocked — not a green Career run", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "career",
      hostMode: "Simulator",
      sessionMode: "Simulator",
      isSessionReal: false,
      isLiveAiReady: false,
      isLoading: false,
    });
    const presentation = resolveWorkingCareerDoorHostModeMatrixCell({
      selectedDoor: "career",
      gate,
      isSessionReal: false,
      hostMode: "Simulator",
      sessionMode: "Simulator",
    });

    expect(presentation.cellId).toBe("career-simulator-blocked");
    expect(presentation.isCareerExecuteBlocked).toBe(true);
    expect(presentation.showStatusTag).toBe(true);
    expect(presentation.statusTagKind).toBe("blocked");
    expect(presentation.effectiveDoor).toBe("rehearsal");
    expect(presentation.detail).toBe(WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL);
    expect(presentation.matrixTestId).toBe("working-career-door-host-mode-career-simulator-blocked");
  });

  it("Rehearsal + Simulator stays labeled rehearsal", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "rehearsal",
      hostMode: "Simulator",
      sessionMode: "Simulator",
      isSessionReal: false,
      isLiveAiReady: false,
      isLoading: false,
    });
    const presentation = resolveWorkingCareerDoorHostModeMatrixCell({
      selectedDoor: "rehearsal",
      gate,
      isSessionReal: false,
      hostMode: "Simulator",
      sessionMode: "Simulator",
    });

    expect(presentation.cellId).toBe("rehearsal-simulator");
    expect(presentation.labelAsRehearsal).toBe(true);
    expect(presentation.showStatusTag).toBe(true);
    expect(presentation.statusTagKind).toBe("needs-attention");
    expect(presentation.detail).toBe(WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_SIMULATOR_DETAIL);
  });

  it("Rehearsal + Real stays labeled practice even when live AI is available", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "rehearsal",
      hostMode: "Real",
      sessionMode: "Real",
      isSessionReal: true,
      isLiveAiReady: true,
      isLoading: false,
    });
    const presentation = resolveWorkingCareerDoorHostModeMatrixCell({
      selectedDoor: "rehearsal",
      gate,
      isSessionReal: true,
      hostMode: "Real",
      sessionMode: "Real",
    });

    expect(presentation.cellId).toBe("rehearsal-real-practice");
    expect(presentation.labelAsRehearsal).toBe(true);
    expect(presentation.showStatusTag).toBe(true);
    expect(presentation.statusTagKind).toBe("needs-attention");
    expect(presentation.effectiveDoor).toBe("rehearsal");
    expect(presentation.detail).toBe(WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_DETAIL);
    expect(presentation.matrixTestId).toBe("working-career-door-host-mode-rehearsal-real-practice");
  });
});
