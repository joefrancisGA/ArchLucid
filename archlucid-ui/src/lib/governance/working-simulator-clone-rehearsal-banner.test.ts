import { describe, expect, it } from "vitest";

import {
  resolveEffectiveWorkingCareerRehearsalDoor,
  resolveWorkingCareerDoorGate,
} from "@/lib/governance/working-career-door-gate";
import {
  WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY,
  WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import {
  isWorkingHostPinnedSimulator,
  resolveWorkingSimulatorCloneRehearsalChrome,
} from "@/lib/governance/working-simulator-clone-rehearsal-banner";

function blockedCareerGate() {
  return resolveWorkingCareerDoorGate({
    selectedDoor: "career",
    hostMode: "Simulator",
    sessionMode: "Simulator",
    isSessionReal: false,
    isLiveAiReady: false,
    isLoading: false,
  });
}

function openCareerGate() {
  return resolveWorkingCareerDoorGate({
    selectedDoor: "career",
    hostMode: "Real",
    sessionMode: "Real",
    isSessionReal: true,
    isLiveAiReady: true,
    isLoading: false,
  });
}

describe("CG-015 Simulator clone rehearsal banner chrome", () => {
  it("pins host Simulator as a Working clone unless the session is Real", () => {
    expect(isWorkingHostPinnedSimulator("Simulator", "Simulator")).toBe(true);
    expect(isWorkingHostPinnedSimulator("Simulator", null)).toBe(true);
    expect(isWorkingHostPinnedSimulator("Simulator", "Real")).toBe(false);
    expect(isWorkingHostPinnedSimulator("Real", "Simulator")).toBe(false);
    expect(isWorkingHostPinnedSimulator(null, "Simulator")).toBe(false);
  });

  it("grandfathers implicit Career on a Simulator clone to Rehearsal with a banner", () => {
    const chrome = resolveWorkingSimulatorCloneRehearsalChrome({
      workingDesk: true,
      guidedDesk: false,
      hostMode: "Simulator",
      sessionMode: "Simulator",
      selectedDoor: "career",
      careerExplicit: false,
      careerGate: blockedCareerGate(),
    });

    expect(chrome.showBanner).toBe(true);
    expect(chrome.effectiveDoor).toBe("rehearsal");
    expect(chrome.careerBlockedHonesty).toBe(false);
    expect(resolveEffectiveWorkingCareerRehearsalDoor("career", blockedCareerGate())).toBe("rehearsal");
  });

  it("keeps explicit Career as AS-078 blocked honesty without switching Guided", () => {
    const chrome = resolveWorkingSimulatorCloneRehearsalChrome({
      workingDesk: true,
      guidedDesk: false,
      hostMode: "Simulator",
      sessionMode: "Simulator",
      selectedDoor: "career",
      careerExplicit: true,
      careerGate: blockedCareerGate(),
    });

    expect(chrome.showBanner).toBe(true);
    expect(chrome.careerBlockedHonesty).toBe(true);
    expect(chrome.effectiveDoor).toBe("rehearsal");
  });

  it("hides the banner on Guided and does not treat Guided as the clone day", () => {
    const chrome = resolveWorkingSimulatorCloneRehearsalChrome({
      workingDesk: false,
      guidedDesk: true,
      hostMode: "Simulator",
      sessionMode: "Simulator",
      selectedDoor: "career",
      careerExplicit: false,
      careerGate: blockedCareerGate(),
    });

    expect(chrome.showBanner).toBe(false);
    expect(chrome.careerBlockedHonesty).toBe(false);
  });

  it("does not show the banner when the host is not Simulator-pinned", () => {
    const chrome = resolveWorkingSimulatorCloneRehearsalChrome({
      workingDesk: true,
      guidedDesk: false,
      hostMode: "Real",
      sessionMode: "Real",
      selectedDoor: "career",
      careerExplicit: true,
      careerGate: openCareerGate(),
    });

    expect(chrome.showBanner).toBe(false);
    expect(chrome.effectiveDoor).toBe("career");
  });

  it("uses rehearsal copy that is not sample and not Guided", () => {
    expect(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE.toLowerCase()).toContain("rehearsal");
    expect(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE.toLowerCase()).not.toContain("sample");
    expect(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE.toLowerCase()).not.toContain("guided");
    expect(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY.toLowerCase()).toContain("rehearsal");
    expect(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY.toLowerCase()).toContain("not a sample workspace");
    expect(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY.toLowerCase()).toContain("not guided teaching");
  });
});
