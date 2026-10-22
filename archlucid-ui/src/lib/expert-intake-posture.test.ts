import { afterEach, describe, expect, it } from "vitest";

import {
  EXPERT_INTAKE_POSTURE_STORAGE_KEY,
  readExpertIntakePostureEnabled,
  resetExpertIntakePostureSessionStateForTests,
  resolveDefaultExpertIntakePostureEnabled,
  writeExpertIntakePostureEnabled,
} from "@/lib/expert-intake-posture";

describe("expert-intake-posture (LP-13)", () => {
  afterEach(() => {
    resetExpertIntakePostureSessionStateForTests();
  });

  it("defaults expert intake on for Working without localStorage", () => {
    expect(window.localStorage.getItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY)).toBeNull();
    expect(resolveDefaultExpertIntakePostureEnabled("working")).toBe(true);
    expect(readExpertIntakePostureEnabled("working")).toBe(true);
  });

  it("defaults expert intake off for Guided without localStorage", () => {
    expect(resolveDefaultExpertIntakePostureEnabled("guided")).toBe(false);
    expect(readExpertIntakePostureEnabled("guided")).toBe(false);
  });

  it("persists explicit opt-out on Working and clears when restored to default", () => {
    writeExpertIntakePostureEnabled(false, "working");

    expect(window.localStorage.getItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY)).toBe("0");
    expect(readExpertIntakePostureEnabled("working")).toBe(false);

    writeExpertIntakePostureEnabled(true, "working");

    expect(window.localStorage.getItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY)).toBeNull();
    expect(readExpertIntakePostureEnabled("working")).toBe(true);
  });

  it("persists explicit opt-in on Guided until cleared", () => {
    writeExpertIntakePostureEnabled(true, "guided");

    expect(window.localStorage.getItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY)).toBe("1");
    expect(readExpertIntakePostureEnabled("guided")).toBe(true);
  });
});
