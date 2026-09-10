import { describe, expect, it } from "vitest";

import {
  resolveWorkingCareerRehearsalBlockedReason,
  shouldLabelWorkingIntentAsRehearsal,
} from "@/lib/governance/working-career-rehearsal-gate";
import {
  DEFAULT_WORKING_CAREER_REHEARSAL_INTENT,
  parseWorkingCareerRehearsalIntent,
} from "@/lib/governance/working-career-rehearsal-intent";
import { resolveInitialWorkingCareerRehearsalIntent } from "@/lib/governance/working-career-rehearsal-preference";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";
import { resolveProductionDeskChrome } from "@/lib/production-desk-chrome";

describe("working-career-rehearsal chrome matrix (AS-084)", () => {
  it("Working + Career + Real is not blocked", () => {
    const blocked = resolveWorkingCareerRehearsalBlockedReason({
      workingDesk: true,
      intent: "career",
      structuralExecutionMode: StructuralExecutionModeWire.Real,
      realExecutionAvailable: true,
    });

    expect(blocked).toBeNull();
  });

  it("Working + Career + Simulator host is blocked with honesty reason", () => {
    const blocked = resolveWorkingCareerRehearsalBlockedReason({
      workingDesk: true,
      intent: "career",
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      realExecutionAvailable: false,
    });

    expect(blocked).toContain("Rehearsal");
  });

  it("Working + Rehearsal + Simulator is labeled rehearsal", () => {
    expect(
      shouldLabelWorkingIntentAsRehearsal({
        workingDesk: true,
        intent: "rehearsal",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      }),
    ).toBe(true);
  });

  it("Guided seat does not use Working career/rehearsal chooser chrome", () => {
    expect(
      resolveProductionDeskChrome({
        workspaceMode: "guided",
      }),
    ).toBe(false);
  });

  it("AS-081 Guided mode must not require Working Career/Rehearsal chooser", () => {
    const guidedChrome = resolveProductionDeskChrome({ workspaceMode: "guided" });
    const workingChrome = resolveProductionDeskChrome({ workspaceMode: "working" });

    expect(guidedChrome).toBe(false);
    expect(workingChrome).toBe(true);
  });

  it("AS-080 new Working tenants default to Career intent", () => {
    expect(
      resolveInitialWorkingCareerRehearsalIntent({
        hasStoredPreference: false,
      }),
    ).toBe(DEFAULT_WORKING_CAREER_REHEARSAL_INTENT);
    expect(parseWorkingCareerRehearsalIntent(null)).toBe("career");
  });
});
