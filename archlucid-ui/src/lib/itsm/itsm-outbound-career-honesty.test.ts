import { describe, expect, it } from "vitest";

import {
  ITSM_OUTBOUND_REHEARSAL_BODY_DISCLAIMER,
  ITSM_OUTBOUND_REHEARSAL_SUMMARY_PREFIX,
  resolveItsmOutboundCareerHonesty,
} from "@/lib/itsm/itsm-outbound-career-honesty";
import { RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL } from "@/lib/runs/run-status-badge-career-honesty";

describe("itsm-outbound-career-honesty (CG-038)", () => {
  it("Career + Real has no ITSM honesty overlay", () => {
    expect(
      resolveItsmOutboundCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Rehearsal + Simulator shows row label and summary prefix", () => {
    const presentation = resolveItsmOutboundCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.rowLabel).toBe(RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL);
    expect(presentation?.summaryPrefix).toBe(ITSM_OUTBOUND_REHEARSAL_SUMMARY_PREFIX);
    expect(presentation?.bodyDisclaimer).toBe(ITSM_OUTBOUND_REHEARSAL_BODY_DISCLAIMER);
  });

  it("does not overlay on Guided desk", () => {
    expect(
      resolveItsmOutboundCareerHonesty({
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
