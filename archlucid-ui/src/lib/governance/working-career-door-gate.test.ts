import { describe, expect, it } from "vitest";

import {
  resolveEffectiveWorkingCareerRehearsalDoor,
  resolveWorkingCareerDoorGate,
  WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF,
} from "@/lib/governance/working-career-door-gate";
import {
  WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
  WORKING_CAREER_DOOR_LIVE_AI_NOT_READY_BLOCKED_DETAIL,
} from "@/lib/governance/working-career-door-gate-copy";

describe("working-career-door-gate", () => {
  it("does not block Rehearsal door selection", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "rehearsal",
      hostMode: "Simulator",
      sessionMode: "Simulator",
      isSessionReal: false,
      isLiveAiReady: false,
      isLoading: false,
    });

    expect(gate.isCareerExecuteBlocked).toBe(false);
  });

  it("blocks Career when host and session are pinned to Simulator", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "career",
      hostMode: "Simulator",
      sessionMode: "Simulator",
      isSessionReal: false,
      isLiveAiReady: false,
      isLoading: false,
    });

    expect(gate.isCareerExecuteBlocked).toBe(true);
    expect(gate.blockReason).toBe("host-simulator-pinned");
    expect(gate.blockedDetail).toBe(WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL);
    expect(gate.platformSettingsHref).toBe(WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF);
  });

  it("blocks Career when session is Real but live AI is not ready", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "career",
      hostMode: "Real",
      sessionMode: "Real",
      isSessionReal: true,
      isLiveAiReady: false,
      isLoading: false,
    });

    expect(gate.isCareerExecuteBlocked).toBe(true);
    expect(gate.blockReason).toBe("live-ai-not-ready");
    expect(gate.blockedDetail).toBe(WORKING_CAREER_DOOR_LIVE_AI_NOT_READY_BLOCKED_DETAIL);
  });

  it("allows Career when session is Real and live AI is ready", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "career",
      hostMode: "Real",
      sessionMode: "Real",
      isSessionReal: true,
      isLiveAiReady: true,
      isLoading: false,
    });

    expect(gate.isCareerExecuteBlocked).toBe(false);
  });

  it("resolves effective door to Rehearsal when Career execute is blocked", () => {
    const gate = resolveWorkingCareerDoorGate({
      selectedDoor: "career",
      hostMode: "Simulator",
      sessionMode: "Simulator",
      isSessionReal: false,
      isLiveAiReady: false,
      isLoading: false,
    });

    expect(resolveEffectiveWorkingCareerRehearsalDoor("career", gate)).toBe("rehearsal");
    expect(resolveEffectiveWorkingCareerRehearsalDoor("rehearsal", gate)).toBe("rehearsal");
  });
});
