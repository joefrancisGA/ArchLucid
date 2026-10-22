import { describe, expect, it } from "vitest";

import {
  applyFocusedPilotModePolicyReferences,
  FOCUSED_PILOT_MODE_POLICY_REFERENCE,
} from "@/lib/focused-pilot-mode-policy-packs";

describe("focused-pilot-mode-policy-packs", () => {
  it("adds the focused pilot token when enabled", () => {
    expect(applyFocusedPilotModePolicyReferences([], true)).toEqual([FOCUSED_PILOT_MODE_POLICY_REFERENCE]);
  });

  it("removes the focused pilot token when disabled", () => {
    expect(
      applyFocusedPilotModePolicyReferences(["starter:azure-cost-governance", FOCUSED_PILOT_MODE_POLICY_REFERENCE], false),
    ).toEqual(["starter:azure-cost-governance"]);
  });
});
