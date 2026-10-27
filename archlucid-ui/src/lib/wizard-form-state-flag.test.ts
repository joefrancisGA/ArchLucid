import { describe, expect, it } from "vitest";

import { wizardFormStateFlagIsSet } from "@/lib/wizard-form-state-flag";

describe("wizardFormStateFlagIsSet", () => {
  it("treats a true scalar flag as set", () => {
    expect(wizardFormStateFlagIsSet(true)).toBe(true);
  });

  it("treats undefined, false, and empty nested maps as unset", () => {
    expect(wizardFormStateFlagIsSet(undefined)).toBe(false);
    expect(wizardFormStateFlagIsSet(false)).toBe(false);
    expect(wizardFormStateFlagIsSet([])).toBe(false);
    expect(wizardFormStateFlagIsSet([false, undefined])).toBe(false);
    expect(wizardFormStateFlagIsSet({ name: false })).toBe(false);
    expect(wizardFormStateFlagIsSet(null)).toBe(false);
  });

  it("walks array and object dirty/touched maps from react-hook-form", () => {
    expect(wizardFormStateFlagIsSet([true])).toBe(true);
    expect(wizardFormStateFlagIsSet([undefined, true])).toBe(true);
    expect(wizardFormStateFlagIsSet([{ name: true }])).toBe(true);
    expect(wizardFormStateFlagIsSet([{ contentType: false }, { content: true }])).toBe(true);
  });
});
