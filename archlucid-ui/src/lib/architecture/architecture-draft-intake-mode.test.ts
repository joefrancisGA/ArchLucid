import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD,
  ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD,
  ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE,
  ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL,
  architectureDraftAllowsBriefUnlock,
  architectureDraftIntakeModeLead,
  isArchitectureDraftInReviewIntake,
} from "./architecture-draft-intake-mode";

describe("architecture-draft-intake-mode", () => {
  it("treats Admitted and Submitted as review intake", () => {
    expect(isArchitectureDraftInReviewIntake("Admitted")).toBe(true);
    expect(isArchitectureDraftInReviewIntake("Submitted")).toBe(true);
    expect(isArchitectureDraftInReviewIntake("Drafting")).toBe(false);
    expect(isArchitectureDraftInReviewIntake("RunSpawned")).toBe(false);
    expect(isArchitectureDraftInReviewIntake(null)).toBe(false);
  });

  it("allows brief unlock only while Admitted", () => {
    expect(architectureDraftAllowsBriefUnlock("Admitted")).toBe(true);
    expect(architectureDraftAllowsBriefUnlock("Submitted")).toBe(false);
    expect(architectureDraftAllowsBriefUnlock("Drafting")).toBe(false);
  });

  it("uses submitted lead copy when the draft is already submitted", () => {
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE).toBe("This architecture is already in review intake");
    expect(architectureDraftIntakeModeLead("Admitted")).toBe(ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD);
    expect(architectureDraftIntakeModeLead("Submitted")).toBe(ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD);
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL).toBe("Continue in review intake");
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL).toBe("Unlock to edit this brief");
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL).toBe("Stay here");
  });
});
